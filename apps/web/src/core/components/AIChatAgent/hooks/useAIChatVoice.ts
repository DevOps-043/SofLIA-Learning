'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSofLIAPersonalization } from '../../../hooks/useSofLIAPersonalization';
import { getElevenLabsVoiceSettings, getWebSpeechVoiceSettings } from '../../../utils/tts-voice-settings';
import { isTTSAbortError, playAudioBlob, requestTTSAudio, speakWithWebSpeech } from '../../../services/tts';
import { chunkSpeechText } from '../../../services/tts/client/speech-chunker';
import { cleanTextForSpeech } from '../../../services/tts/client/clean-text';

interface SpeechErrorEvent { error: string }
interface SpeechResultEvent { results: Array<Array<{ transcript: string }>> }
interface BrowserSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechResultEvent) => void) | null
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition
}

const SPEECH_LANGUAGE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  pt: 'pt-BR',
};

export interface UseAIChatVoiceReturn {
  isSpeaking: boolean;
  isRecording: boolean;
  isVoiceEnabled: boolean;
  voiceError: string | null;
  stopAllAudio: () => void;
  speakText: (text: string) => Promise<void>;
  toggleRecording: (onTranscript?: (text: string) => void) => Promise<void>;
}

export function useAIChatVoice(language: string, tCommon: (key: string) => string): UseAIChatVoiceReturn {
  const { settings: liaSettings } = useSofLIAPersonalization();
  const isVoiceEnabled = liaSettings?.voice_enabled ?? true;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const stopAllAudio = useCallback(() => {
    try {
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort(); } catch { /* ignore */ }
        ttsAbortRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      setIsSpeaking(false);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => { stopAllAudio(); };
  }, [stopAllAudio]);

  const speakText = useCallback(async (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') return;

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText || cleanedText.trim().length === 0) return;

    stopAllAudio();

    const webSpeechSettings = getWebSpeechVoiceSettings(liaSettings);
    const elevenLabsSettings = getElevenLabsVoiceSettings(liaSettings);
    const controller = new AbortController();
    ttsAbortRef.current = controller;

    // Troceo: sintetizamos y reproducimos el PRIMER fragmento de inmediato
    // mientras prefetcheamos el siguiente. Así el audio empieza en ~2-4 s en
    // lugar de esperar a sintetizar toda la respuesta (~15 s).
    const chunks = chunkSpeechText(cleanedText);
    if (chunks.length === 0) return;

    const requestChunk = (chunk: string) =>
      requestTTSAudio({ text: chunk, voiceSettings: elevenLabsSettings, context: 'chat' }, controller.signal);

    let prefetched: Promise<Blob | null> | null = null;

    try {
      setIsSpeaking(true);

      for (let i = 0; i < chunks.length; i += 1) {
        if (controller.signal.aborted) break;

        const blobPromise = prefetched ?? requestChunk(chunks[i]);
        prefetched = null;

        let blob: Blob | null;
        try {
          blob = await blobPromise;
        } catch (chunkError) {
          if (isTTSAbortError(chunkError)) break;
          throw chunkError;
        }

        if (controller.signal.aborted || ttsAbortRef.current !== controller) break;

        // Proveedor de TTS no disponible (503): fallback a Web Speech con el
        // texto completo (solo en el primer fragmento; si ya sonó algo, paramos).
        if (!blob) {
          if (i === 0) {
            speakWithWebSpeech(
              cleanedText,
              utteranceRef,
              { lang: SPEECH_LANGUAGE_MAP[language] || 'es-ES', ...webSpeechSettings },
              () => setIsSpeaking(false),
            );
            if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
            return;
          }
          break;
        }

        // Prefetch del siguiente fragmento durante la reproducción del actual.
        if (i + 1 < chunks.length) {
          prefetched = requestChunk(chunks[i + 1]);
          prefetched.catch(() => { /* se maneja al await en la próxima iteración */ });
        }

        await new Promise<void>((resolve) => {
          playAudioBlob(blob, audioRef, { onFinish: () => resolve() }).catch(() => resolve());
          if (controller.signal.aborted) { resolve(); return; }
          controller.signal.addEventListener('abort', () => resolve(), { once: true });
        });
      }
    } catch (error: unknown) {
      if (!isTTSAbortError(error)) {
        techDebtLogger.error('Error en sintesis de voz:', error);
      }
    } finally {
      if (!controller.signal.aborted) setIsSpeaking(false);
      if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
    }
  }, [isVoiceEnabled, language, stopAllAudio, liaSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const speechWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANGUAGE_MAP[language] || 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onerror = (event: SpeechErrorEvent) => {
      techDebtLogger.warn('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        setVoiceError(tCommon('aiChat.voice.microphoneError'));
      }
    };

    recognition.onend = () => { setIsRecording(false); };

    recognitionRef.current = recognition;

    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    };
  }, [language, tCommon]);

  const toggleRecording = useCallback(async (onTranscript?: (text: string) => void) => {
    if (!recognitionRef.current) {
      setVoiceError(tCommon('aiChat.voice.speechNotSupported'));
      return;
    }

    if (isRecording) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      setIsRecording(false);
    } else {
      try {
        stopAllAudio();
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.lang = SPEECH_LANGUAGE_MAP[language] || 'es-ES';

        recognitionRef.current.onresult = (event: SpeechResultEvent) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim() && onTranscript) {
            onTranscript(transcript);
          }
          setIsRecording(false);
        };

        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error: unknown) {
        techDebtLogger.error('Error starting speech recognition:', error);
        setIsRecording(false);
        if (error instanceof Error && error.name === 'NotAllowedError') {
          setVoiceError(tCommon('aiChat.voice.microphoneError'));
        }
      }
    }
  }, [isRecording, language, tCommon, stopAllAudio]);

  return { isSpeaking, isRecording, isVoiceEnabled, voiceError, stopAllAudio, speakText, toggleRecording };
}
