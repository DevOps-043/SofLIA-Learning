import { useCallback, useEffect, useRef, useState } from 'react';
import { isTTSAbortError, playAudioBlob, requestTTSAudio, speakWithWebSpeech } from '../../../core/services/tts';

const ELEVENLABS_CONFIG = {
  speed: 1.1,
  stability: 0.75,
  similarity_boost: 0.8,
  style: 0.85,
  use_speaker_boost: true,
};

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
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  toggleListening: () => Promise<void>;
}

function numberToWords(num: number): string {
  const numbers: Record<number, string> = {
    0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
    6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciseis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte',
    21: 'veintiuno', 22: 'veintidos', 23: 'veintitres', 24: 'veinticuatro', 25: 'veinticinco',
    26: 'veintiseis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve', 30: 'treinta',
  };

  if (numbers[num] !== undefined) {
    return numbers[num];
  }

  if (num < 100) {
    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;
    if (tens === 30 && ones > 0) return `treinta y ${numbers[ones] || ones}`;
    if (tens === 40 && ones > 0) return `cuarenta y ${numbers[ones] || ones}`;
    if (tens === 50 && ones > 0) return `cincuenta y ${numbers[ones] || ones}`;
  }

  return num.toString();
}

function formatTextForTTS(text: string): string {
  let formatted = text;

  if (formatted.includes('Soy SofLIA') && formatted.includes('Planificador de Estudios')) {
    if (formatted.includes('Tienes asignado el siguiente curso')) {
      const courseMatch = formatted.match(/Curso:\s*([^\n]+)/i);
      const courseName = courseMatch ? courseMatch[1].trim() : 'tu curso asignado';

      return [
        'Soy SofLIA, tu asistente de planificacion.',
        `He analizado tu perfil y veo que tienes asignado el curso de ${courseName}.`,
        'Te gustaria que programemos sesiones rapidas, normales o largas?',
      ].join(' ');
    }
  }

  const processedMarkers = new Set<string>();

  formatted = formatted.replace(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM|a\.m\.|p\.m\.)/gi, (match, hour, minute, period) => {
    const marker = `TIME_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const periodText = period.toLowerCase().includes('p') ? 'de la tarde' : 'de la manana';
    const hourText = numberToWords(h);

    if (m === 0) return `${hourText} ${periodText}`;
    return `${hourText} y ${numberToWords(m)} ${periodText}`;
  });

  formatted = formatted.replace(/(\d{1,2})\s+(AM|PM|a\.m\.|p\.m\.)/gi, (match, hour, period) => {
    const marker = `TIME2_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const h = parseInt(hour, 10);
    const periodText = period.toLowerCase().includes('p') ? 'de la tarde' : 'de la manana';
    return `${numberToWords(h)} ${periodText}`;
  });

  formatted = formatted.replace(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, (match, day, month) => {
    const marker = `DATE_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const parsedDay = parseInt(day, 10);
    const dayText = parsedDay === 1 ? 'primero' : numberToWords(parsedDay);
    return `${dayText} de ${month}`;
  });

  formatted = formatted.replace(/(\d+)%/g, (match, num) => {
    const marker = `PERCENT_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    return `${numberToWords(parseInt(num, 10))} por ciento`;
  });

  formatted = formatted.replace(/\b(\d{1,2})\b/g, (match, num) => {
    const marker = `NUM_${match}`;
    if (processedMarkers.has(marker)) return match;

    const parsed = parseInt(num, 10);
    if (parsed <= 30 && parsed >= 0) {
      processedMarkers.add(marker);
      return numberToWords(parsed);
    }
    return match;
  });

  formatted = formatted.replace(/(\d{1,2})\.\s/g, (match, num) => {
    const parsed = parseInt(num, 10);
    if (parsed <= 30) return `${numberToWords(parsed)}. `;
    return match;
  });

  formatted = formatted.replace(/\s+/g, ' ');
  formatted = formatted.replace(/\s+([.,;:!?])/g, '$1');
  formatted = formatted.replace(/([.,;:!?])\s*([.,;:!?])/g, '$1 $2');

  return formatted.trim();
}

export function useStudyPlannerVoiceInteraction({
  isAudioEnabled,
  isProcessing,
  onTranscript,
}: UseStudyPlannerVoiceInteractionParams): UseStudyPlannerVoiceInteractionResult {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const lastTranscriptRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });
  const pendingTranscriptRef = useRef<string | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const lastErrorTimeRef = useRef(0);
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const isProcessingRef = useRef(isProcessing);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopAllAudio = useCallback(() => {
    try {
      if (ttsAbortRef.current) {
        try {
          ttsAbortRef.current.abort();
        } catch {
          // ignore abort races
        }
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
    } catch (error) {
      console.warn('Error deteniendo audio:', error);
    }
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!isAudioEnabledRef.current || typeof window === 'undefined') return;

    stopAllAudio();

    try {
      setIsSpeaking(true);

      const controller = new AbortController();
      ttsAbortRef.current = controller;
      const audioBlob = await requestTTSAudio(
        {
          text: formatTextForTTS(text),
          voiceSettings: ELEVENLABS_CONFIG,
          speed: ELEVENLABS_CONFIG.speed,
        },
        controller.signal
      );

      if (!ttsAbortRef.current || ttsAbortRef.current !== controller || controller.signal.aborted) {
        if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
        return;
      }

      if (!audioBlob) {
        speakWithWebSpeech(
          text,
          utteranceRef,
          {
            lang: 'es-ES',
            rate: 0.9,
            pitch: 1,
            volume: 0.8,
          },
          () => setIsSpeaking(false)
        );
        if (ttsAbortRef.current === controller) {
          ttsAbortRef.current = null;
        }
        return;
      }

      await playAudioBlob(audioBlob, audioRef, {
        onFinish: () => setIsSpeaking(false),
      });
      if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
    } catch (error) {
      if (!isTTSAbortError(error)) {
        console.error('Error en sintesis de voz con ElevenLabs:', error);
      }
      setIsSpeaking(false);
    }
  }, [stopAllAudio]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      console.warn('El navegador no soporta reconocimiento de voz');
      return undefined;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const speechToTextRaw = event.results[0]?.[0]?.transcript || '';
      const speechToText = speechToTextRaw.trim();
      const normalized = speechToText.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

      if (normalized.length < 2) {
        setIsListening(false);
        return;
      }

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

        if (isProcessingRef.current) {
          setIsListening(false);
          return;
        }

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

      try {
        recognition.stop();
      } catch {
        // ignore stop races
      }

      setIsListening(false);

      if (errorType === 'network' && now - lastErrorTimeRef.current < 2000) {
        return;
      }

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

      try {
        recognition.stop();
      } catch {
        // ignore stop races
      }

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
      try {
        recognition.stop();
      } catch {
        // ignore stop races
      }
      setIsListening(false);
      return;
    }

    stopAllAudio();

    try {
      try {
        recognition.stop();
      } catch {
        // ignore stop races
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      await navigator.mediaDevices.getUserMedia({ audio: true });

      recognition.start();
      setIsListening(true);
    } catch (error) {
      const typedError = error as Error;
      console.error('Error al solicitar permisos de microfono:', error);
      setIsListening(false);

      if (typedError.name === 'NotAllowedError') {
        setVoiceError('Necesito permiso para usar el microfono. Por favor permite el acceso al microfono en tu navegador y vuelve a intentar.');
      }
    }
  }, [isListening, stopAllAudio]);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  return {
    isListening,
    isSpeaking,
    voiceError,
    setVoiceError,
    speakText,
    stopAllAudio,
    toggleListening,
  };
}
