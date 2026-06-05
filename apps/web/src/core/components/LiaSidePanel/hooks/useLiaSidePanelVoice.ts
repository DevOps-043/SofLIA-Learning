'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SofLIAMessage } from '../../../types/lia.types';
import type { SofLIAPersonalizationSettings } from '../../../types/soflia-personalization.types';
import {
  StreamingSpeechPlayer,
  findFirstSpeakableBoundary,
} from '../../../services/tts/client/streaming-speech-player';
import { LiaVoiceMetricsTracker } from '../../../services/lia-voice-metrics.client';
import { cleanTextForLiaTTS } from '../services/lia-side-panel-voice.service';

interface UseLiaSidePanelVoiceOptions {
  messages: SofLIAMessage[];
  isLoading: boolean;
  isOpen: boolean;
  isVoiceEnabled: boolean;
  language: string;
  settings: SofLIAPersonalizationSettings | null | undefined;
}

/**
 * Largo de texto (índice exclusivo) ya "revelado" en sincronía con el audio para
 * un mensaje dado. Cuando `messageId` es `null` no hay restricción de revelado
 * (el texto se muestra completo, p. ej. con la voz desactivada).
 */
export interface VoiceRevealState {
  messageId: string | null;
  length: number;
}

const NO_REVEAL: VoiceRevealState = { messageId: null, length: 0 };
const REVEAL_GRACE_AFTER_AUDIO_SLOT_MS = 900;
const FIRST_SPEECH_BOUNDARY = { minChars: 12, softCap: 56 };
const REST_SPEECH_BOUNDARY = { minChars: 80, softCap: 220 };
const STREAMING_CHUNKS_BEFORE_FINAL = 3;
const MAX_TTS_CHUNKS_PER_TURN = 4;

/**
 * Voz de salida del panel SofLIA en STREAMING con sincronía estilo "karaoke":
 * cada oración se sintetiza y reproduce apenas se completa en la transmisión, y
 * el TEXTO de la respuesta se revela al ritmo del audio (no antes). Cuando la voz
 * está desactivada no hay revelado gradual (el texto se muestra completo).
 *
 * Solo locuta/revela respuestas presenciadas en streaming (pasan por la fase
 * `isLoading=true` con contenido creciente); el saludo estático y el historial
 * cargado no se ven afectados.
 */
export function useLiaSidePanelVoice({
  messages,
  isLoading,
  isOpen,
  isVoiceEnabled,
  language: _language,
  settings: _settings,
}: UseLiaSidePanelVoiceOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReveal, setVoiceReveal] = useState<VoiceRevealState>(NO_REVEAL);
  const metricsTrackerRef = useRef(new LiaVoiceMetricsTracker('side_panel'));
  const playerRef = useRef<StreamingSpeechPlayer | null>(null);
  const revealTimersRef = useRef<Set<ReturnType<typeof globalThis.setTimeout>>>(
    new Set(),
  );
  const isPlayingRef = useRef(false);
  const streamFinishedRef = useRef(false);
  // Estado de la respuesta que se está presenciando en streaming.
  const streamRef = useRef<{
    messageId: string | null;
    consumed: number;
    queuedChunks: number;
  }>({
    messageId: null,
    consumed: 0,
    queuedChunks: 0,
  });

  const clearRevealTimers = useCallback(() => {
    revealTimersRef.current.forEach((timer) => globalThis.clearTimeout(timer));
    revealTimersRef.current.clear();
  }, []);

  const stopAllAudio = useCallback(() => {
    clearRevealTimers();
    playerRef.current?.stop();
    playerRef.current = null;
    streamRef.current = { messageId: null, consumed: 0, queuedChunks: 0 };
    isPlayingRef.current = false;
    streamFinishedRef.current = false;
    metricsTrackerRef.current.flush('stopped');
    setIsSpeaking(false);
    setVoiceReveal(NO_REVEAL);
  }, [clearRevealTimers]);

  const handlePlayingChange = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
    setIsSpeaking(playing);

    if (!playing && streamFinishedRef.current) {
      metricsTrackerRef.current.flush('completed');
    }
  }, []);

  // Encola un fragmento y programa revelar su texto cuando empiece a sonar.
  const enqueueWithReveal = useCallback(
    (messageId: string, chunk: string, endIndex: number) => {
      const cleaned = cleanTextForLiaTTS(chunk);
      if (!cleaned) {
        setVoiceReveal((prev) =>
          prev.messageId === messageId ? { messageId, length: endIndex } : prev,
        );
        return;
      }

      let clearGraceTimer: (() => void) | null = null;
      const reveal = (event: { audioAvailable: boolean }) => {
        clearGraceTimer?.();
        clearGraceTimer = null;
        metricsTrackerRef.current.recordChunkStarted(event.audioAvailable);
        setVoiceReveal((prev) =>
          prev.messageId === messageId ? { messageId, length: endIndex } : prev,
        );
      };

      const accepted = playerRef.current?.enqueue(
        cleaned,
        reveal,
        () => {
          metricsTrackerRef.current.recordPlaybackSlot();
          const timer = globalThis.setTimeout(() => {
            revealTimersRef.current.delete(timer);
            clearGraceTimer = null;
            metricsTrackerRef.current.recordGraceReveal();
            reveal({ audioAvailable: false });
          }, REVEAL_GRACE_AFTER_AUDIO_SLOT_MS);

          revealTimersRef.current.add(timer);
          clearGraceTimer = () => {
            globalThis.clearTimeout(timer);
            revealTimersRef.current.delete(timer);
          };
        },
        (event) => metricsTrackerRef.current.recordSynthesisResult(event),
      );
      if (accepted) {
        metricsTrackerRef.current.recordChunkQueued();
        streamRef.current.queuedChunks += 1;
      }
    },
    [],
  );

  useEffect(() => {
    // La voz es opt-in (`voice_enabled`): si está activa, locuta y revela el
    // texto en sincronía; si no, no gatea el revelado (texto completo al instante).
    if (!isVoiceEnabled || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant' || lastMessage.id === 'initial') {
      return;
    }

    const content = lastMessage.content ?? '';

    if (isLoading) {
      // Respuesta en curso (presenciada en streaming).
      if (streamRef.current.messageId !== lastMessage.id) {
        playerRef.current?.stop();
        metricsTrackerRef.current.startTurn(lastMessage.clientTurnStartedAtMs);
        playerRef.current = new StreamingSpeechPlayer({
          onPlayingChange: handlePlayingChange,
        });
        streamRef.current = { messageId: lastMessage.id, consumed: 0, queuedChunks: 0 };
        streamFinishedRef.current = false;
        metricsTrackerRef.current.attachMessage(lastMessage.id);
        setVoiceReveal({ messageId: lastMessage.id, length: 0 });
      }

      if (content.length > 0) {
        metricsTrackerRef.current.markFirstText();
      }

      if (!playerRef.current) return;

      if (streamRef.current.queuedChunks >= STREAMING_CHUNKS_BEFORE_FINAL) {
        return;
      }

      const consumed = streamRef.current.consumed;
      const pending = content.slice(consumed);
      // El PRIMER fragmento arranca cuanto antes (cláusula corta) para reducir
      // el desfase inicial; los siguientes se cortan por oración completa.
      const boundary =
        consumed === 0
          ? findFirstSpeakableBoundary(pending, FIRST_SPEECH_BOUNDARY)
          : findFirstSpeakableBoundary(pending, REST_SPEECH_BOUNDARY);
      if (boundary > 0) {
        const endIndex = consumed + boundary;
        enqueueWithReveal(lastMessage.id, pending.slice(0, boundary), endIndex);
        streamRef.current.consumed = endIndex;
      }
      return;
    }

    // isLoading === false
    if (streamRef.current.messageId === lastMessage.id && playerRef.current) {
      // Fin de una respuesta que sí presenciamos: locuta/revela el resto.
      let pending = content.slice(streamRef.current.consumed);
      while (
        pending.trim() &&
        streamRef.current.queuedChunks < MAX_TTS_CHUNKS_PER_TURN
      ) {
        const slotsLeft = MAX_TTS_CHUNKS_PER_TURN - streamRef.current.queuedChunks;
        const boundary = slotsLeft <= 1
          ? pending.length
          : findFirstSpeakableBoundary(pending, REST_SPEECH_BOUNDARY);
        const chunkLength = boundary > 0 ? boundary : pending.length;
        const endIndex = streamRef.current.consumed + chunkLength;

        enqueueWithReveal(lastMessage.id, pending.slice(0, chunkLength), endIndex);
        streamRef.current.consumed = endIndex;
        pending = content.slice(streamRef.current.consumed);
      }
      metricsTrackerRef.current.completeStream(content.length);
      streamFinishedRef.current = true;
      if (!isPlayingRef.current) {
        metricsTrackerRef.current.flush('completed');
      }
      streamRef.current = { messageId: null, consumed: 0, queuedChunks: 0 };
    }
    // Si no la presenciamos (saludo/historial/ya cerrada) → no se locuta/revela.
  }, [messages, isLoading, isVoiceEnabled, enqueueWithReveal, handlePlayingChange]);

  // Si se desactiva la voz, libera el revelado (muestra el texto completo).
  useEffect(() => {
    if (!isVoiceEnabled) {
      stopAllAudio();
    }
  }, [isVoiceEnabled, stopAllAudio]);

  // Corta la voz al cerrar el panel y al desmontar.
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
    }
    return () => {
      stopAllAudio();
    };
  }, [isOpen, stopAllAudio]);

  return {
    isSpeaking,
    voiceReveal,
    stopAllAudio,
  };
}
