import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoicePlaybackMode } from '../services/study-planner-voice-text.service';
import { useVoiceAudioPlayback } from './useVoiceAudioPlayback';

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
}

interface BrowserSpeechRecognitionResult {
  0: BrowserSpeechRecognitionAlternative;
  length: number;
}

interface BrowserSpeechRecognitionEvent {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
}

interface BrowserSpeechRecognitionErrorEvent {
  error?: string;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
}

interface UseStudyPlannerVoiceInteractionParams {
  isAudioEnabled: boolean;
  isProcessing: boolean;
  onTranscript: (transcript: string) => void | Promise<void>;
}

interface UseStudyPlannerVoiceInteractionResult {
  isListening: boolean;
  isSpeaking: boolean;
  voiceError: string | null;
  setVoiceError: React.Dispatch<React.SetStateAction<string | null>>;
  speakText: (text: string, mode?: VoicePlaybackMode) => Promise<void>;
  stopAllAudio: (mode?: VoicePlaybackMode) => void;
  toggleListening: () => Promise<void>;
}

export function useStudyPlannerVoiceInteraction({
  isAudioEnabled,
  isProcessing,
  onTranscript,
}: UseStudyPlannerVoiceInteractionParams): UseStudyPlannerVoiceInteractionResult {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const isAudioEnabledRef = useRef(isAudioEnabled);
  const isProcessingRef = useRef(isProcessing);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => { isAudioEnabledRef.current = isAudioEnabled; }, [isAudioEnabled]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const { isSpeaking, speakText, stopAllAudio } = useVoiceAudioPlayback(isAudioEnabledRef);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const pendingTranscriptRef = useRef<string | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const lastTranscriptRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });
  const lastErrorTimeRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognitionCtor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      techDebtLogger.warn('El navegador no soporta reconocimiento de voz');
      return undefined;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const raw = event.results[0]?.[0]?.transcript || '';
      const speechToText = raw.trim();
      const normalized = speechToText.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

      if (normalized.length < 2) { setIsListening(false); return; }

      pendingTranscriptRef.current = speechToText;
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      pendingTimeoutRef.current = window.setTimeout(() => {
        pendingTimeoutRef.current = null;
        const now = Date.now();

        if (lastTranscriptRef.current.text === normalized && now - lastTranscriptRef.current.ts < 3000) {
          setIsListening(false);
          return;
        }

        if (isProcessingRef.current) { setIsListening(false); return; }

        lastTranscriptRef.current = { text: normalized, ts: now };
        const finalTranscript = pendingTranscriptRef.current || speechToText;
        pendingTranscriptRef.current = null;
        setIsListening(false);
        void onTranscriptRef.current(finalTranscript);
      }, 350);
    };

    recognition.onerror = (event) => {
      const errorType = event.error || 'unknown';
      const now = Date.now();
      try { recognition.stop(); } catch { /* ignore stop races */ }
      setIsListening(false);
      if (errorType === 'network' && now - lastErrorTimeRef.current < 2000) return;
      lastErrorTimeRef.current = now;
      if (errorType === 'not-allowed') {
        setVoiceError('Necesito permiso para usar el microfono. Por favor habilita el acceso al microfono en tu navegador e intenta de nuevo.');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
      try { recognition.stop(); } catch { /* ignore stop races */ }
      recognitionRef.current = null;
    };
  }, []);

  const toggleListening = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError('Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.');
      return;
    }

    if (isListening) {
      try { recognition.stop(); } catch { /* ignore stop races */ }
      setIsListening(false);
      return;
    }

    stopAllAudio('interruptByUser');

    try {
      try { recognition.stop(); } catch { /* ignore stop races */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognition.start();
      setIsListening(true);
    } catch (error) {
      const typedError = error as Error;
      techDebtLogger.error('Error al solicitar permisos de microfono:', error);
      setIsListening(false);
      if (typedError.name === 'NotAllowedError') {
        setVoiceError('Necesito permiso para usar el microfono. Por favor permite el acceso al microfono en tu navegador y vuelve a intentar.');
      }
    }
  }, [isListening, stopAllAudio]);

  useEffect(() => {
    return () => { stopAllAudio('interruptByUser'); };
  }, [stopAllAudio]);

  return { isListening, isSpeaking, voiceError, setVoiceError, speakText, stopAllAudio, toggleListening };
}
