'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SofLIAMessage } from '@/core/types/lia.types';
import type { VoiceRevealState } from './useLiaSidePanelVoice';
import { getLiaSpeechLanguage } from '../services/lia-side-panel-voice.service';

type TurnVoiceStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'preparing-audio'
  | 'speaking'
  | 'error';

// SpeechRecognition no permite configurar su detector de fin de frase. Dejamos
// la sesión continua y cerramos nosotros el turno después de una pausa real,
// para que respirar o pensar entre dos frases no envíe la solicitud antes de
// tiempo.
export const VOICE_END_OF_TURN_SILENCE_MS = 2_200;
const RECOGNITION_RESTART_DELAY_MS = 120;

interface RecognitionAlternativeLike { transcript: string }
interface RecognitionResultLike extends ArrayLike<RecognitionAlternativeLike> {
  0: RecognitionAlternativeLike
  isFinal: boolean
}
interface RecognitionEventLike {
  resultIndex: number
  results: ArrayLike<RecognitionResultLike>
}
interface RecognitionErrorLike { error: string }
interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: RecognitionEventLike) => void) | null
  onerror: ((event: RecognitionErrorLike) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
interface RecognitionConstructor { new (): RecognitionLike }
type RecognitionWindow = Window & {
  SpeechRecognition?: RecognitionConstructor
  webkitSpeechRecognition?: RecognitionConstructor
}

interface UseLiaTurnVoiceParams {
  enabled: boolean
  isOpen: boolean
  language: string
  messages: SofLIAMessage[]
  isLoading: boolean
  isSpeaking: boolean
  voiceReveal: VoiceRevealState
  pageContext: Record<string, unknown> | null
  sendMessage: (
    message: string,
    isSystemMessage?: boolean,
    pageContext?: Record<string, unknown>,
  ) => Promise<void>
}

/**
 * Conversación por voz basada en turnos: reconocimiento del navegador -> chat
 * normal de SofLIA -> ElevenLabs. No usa una Live API ni enseña la transcripción
 * mientras el modo está activo; el historial queda disponible al salir.
 */
export function useLiaTurnVoice(params: UseLiaTurnVoiceParams) {
  const [status, setStatus] = useState<TurnVoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const activeRef = useRef(false);
  const awaitingReplyRef = useRef(false);
  const committedTranscriptRef = useRef('');
  const sessionTranscriptRef = useRef('');
  const lastSpeechAtRef = useRef(0);
  const finalizeOnEndRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    awaitingReplyRef.current = false;
    committedTranscriptRef.current = '';
    sessionTranscriptRef.current = '';
    finalizeOnEndRef.current = false;
    clearTimers();
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    recognitionRef.current = null;
    setStatus('idle');
  }, [clearTimers]);

  const submitTranscript = useCallback(() => {
    if (!activeRef.current || awaitingReplyRef.current) return;

    const transcript = [committedTranscriptRef.current, sessionTranscriptRef.current]
      .filter(Boolean)
      .join(' ')
      .trim();
    committedTranscriptRef.current = '';
    sessionTranscriptRef.current = '';
    clearTimers();

    if (!transcript) return;

    awaitingReplyRef.current = true;
    setStatus('processing');
    void params.sendMessage(transcript, false, {
      ...(params.pageContext ?? {}),
      interactionMode: 'voice-conversation',
    }).catch(() => {
      awaitingReplyRef.current = false;
      activeRef.current = false;
      setStatus('error');
      setError('No se pudo enviar tu solicitud. Inténtalo de nuevo.');
    });
  }, [clearTimers, params.pageContext, params.sendMessage]);

  const finishAfterSilence = useCallback(() => {
    if (!activeRef.current || awaitingReplyRef.current) return;
    finalizeOnEndRef.current = true;
    const recognition = recognitionRef.current;
    if (!recognition) {
      finalizeOnEndRef.current = false;
      submitTranscript();
      return;
    }

    try {
      recognition.stop();
    } catch {
      recognitionRef.current = null;
      finalizeOnEndRef.current = false;
      submitTranscript();
    }
  }, [submitTranscript]);

  const scheduleSilenceFinish = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(
      finishAfterSilence,
      VOICE_END_OF_TURN_SILENCE_MS,
    );
  }, [finishAfterSilence]);

  const beginListening = useCallback(() => {
    if (!activeRef.current || awaitingReplyRef.current || recognitionRef.current) return;
    if (typeof window === 'undefined') return;

    const speechWindow = window as RecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      activeRef.current = false;
      setStatus('error');
      setError('Tu navegador no soporta conversación por voz. Usa Chrome, Edge o Safari.');
      return;
    }

    sessionTranscriptRef.current = '';
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = getLiaSpeechLanguage(params.language);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus('listening');
    recognition.onresult = (event) => {
      let text = '';
      // `results` contiene el snapshot completo del turno; reconstruirlo evita
      // duplicar el mismo interim transcript en eventos consecutivos.
      for (let index = 0; index < event.results.length; index += 1) {
        text += `${event.results[index][0].transcript} `;
      }
      if (text.trim()) {
        sessionTranscriptRef.current = text.trim();
        lastSpeechAtRef.current = Date.now();
        scheduleSilenceFinish();
      }
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        activeRef.current = false;
        setStatus('error');
        setError('Necesitamos acceso al micrófono para conversar con SofLIA. Revisa los permisos del navegador.');
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (!activeRef.current) return;

      const sessionTranscript = sessionTranscriptRef.current.trim();
      if (sessionTranscript) {
        committedTranscriptRef.current = [
          committedTranscriptRef.current,
          sessionTranscript,
        ].filter(Boolean).join(' ');
        sessionTranscriptRef.current = '';
      }

      if (finalizeOnEndRef.current) {
        finalizeOnEndRef.current = false;
        submitTranscript();
        return;
      }

      // Algunos motores cierran solos aunque `continuous=true`. Conservamos lo
      // reconocido y reabrimos el micrófono; el temporizador de silencio sigue
      // siendo quien decide cuándo termina realmente el turno.
      const elapsedSinceSpeech = Date.now() - lastSpeechAtRef.current;
      if (
        committedTranscriptRef.current &&
        elapsedSinceSpeech >= VOICE_END_OF_TURN_SILENCE_MS
      ) {
        submitTranscript();
        return;
      }

      restartTimerRef.current = setTimeout(beginListening, RECOGNITION_RESTART_DELAY_MS);
    };

    setStatus('connecting');
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus('error');
      setError('No se pudo iniciar el micrófono. Inténtalo de nuevo.');
    }
  }, [params.language, scheduleSilenceFinish, submitTranscript]);

  const start = useCallback(() => {
    if (!params.enabled || activeRef.current) return;
    setError(null);
    activeRef.current = true;
    awaitingReplyRef.current = false;
    committedTranscriptRef.current = '';
    sessionTranscriptRef.current = '';
    lastSpeechAtRef.current = 0;
    finalizeOnEndRef.current = false;
    beginListening();
  }, [beginListening, params.enabled]);

  const toggle = useCallback(() => {
    if (activeRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => {
    if (!activeRef.current || !awaitingReplyRef.current) return;
    if (params.isLoading) {
      setStatus('processing');
      return;
    }

    const lastMessage = params.messages[params.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;
    if (params.isSpeaking) {
      setStatus('speaking');
      return;
    }

    const audioPending =
      params.voiceReveal.messageId === lastMessage.id &&
      params.voiceReveal.length < (lastMessage.content?.length ?? 0);
    if (audioPending) {
      setStatus('preparing-audio');
      return;
    }

    awaitingReplyRef.current = false;
    restartTimerRef.current = setTimeout(beginListening, 300);
  }, [
    beginListening,
    params.isLoading,
    params.isSpeaking,
    params.messages,
    params.voiceReveal.length,
    params.voiceReveal.messageId,
  ]);

  useEffect(() => {
    if (!params.isOpen || !params.enabled) stop();
  }, [params.enabled, params.isOpen, stop]);

  useEffect(() => () => stop(), [stop]);

  return {
    status,
    error,
    isActive: status !== 'idle' && status !== 'error',
    isAssistantSpeaking: params.isSpeaking,
    start,
    toggle,
    stop,
    clearError: () => setError(null),
  };
}
