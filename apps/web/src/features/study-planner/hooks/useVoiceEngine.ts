/**
 * useVoiceEngine Hook
 *
 * Encapsula toda la lógica de síntesis de voz (ElevenLabs TTS),
 * reconocimiento de voz (Web Speech API), y control de audio.
 *
 * Principios:
 * - Responsabilidad única: solo voz/audio, sin lógica de negocio
 * - Sin dependencias del planificador: usa callbacks para comunicación con el padre
 * - Funciones puras exportadas por separado para testeo/reuso
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface VoiceEngineCallbacks {
  /** Llamado cuando un transcript de voz finalizado está listo para procesamiento */
  onTranscriptReady?: (transcript: string) => void;
}

export interface VoiceEngineState {
  isListening: boolean;
  isSpeaking: boolean;
  isAudioEnabled: boolean;
  transcript: string;
}

export interface VoiceEngineActions {
  /** Sintetizar texto a voz usando ElevenLabs (o Web Speech API como fallback) */
  speak: (text: string, forceEnable?: boolean) => Promise<void>;
  /** Detener todo audio/voz en reproducción */
  stopAll: () => void;
  /** Iniciar o detener reconocimiento de voz */
  toggleListening: () => Promise<void>;
  /** Activar/desactivar audio globalmente. Opcionalmente recibe texto para hablar al activar. */
  toggleAudio: (speakOnEnable?: string) => void;
  /** Ref expuesta para controlar guardia de procesamiento concurrente desde el componente padre */
  processingRef: React.MutableRefObject<boolean>;
}

// =============================================================================
// ELEVENLABS CONFIG
// =============================================================================

const ELEVENLABS_CONFIG = {
  // Velocidad del habla (0.25-4.0): 1.0 = normal
  speed: 1.1,
  // Estabilidad de la voz (0.0-1.0): Más alto = más consistente
  stability: 0.75,
  // Similitud con la voz original (0.0-1.0)
  similarity_boost: 0.8,
  // Estilo de expresión (0.0-1.0): Más alto = más expresivo
  style: 0.85,
  // Mejora la claridad del hablante
  use_speaker_boost: true,
} as const;

// =============================================================================
// PURE FUNCTIONS (exportadas para reuso y testeo)
// =============================================================================

/**
 * Convierte un número (0-59) a su equivalente en palabras en español.
 * Devuelve el numeral como string si no puede convertir.
 */
export function numberToWords(num: number): string {
  const numbers: Record<number, string> = {
    0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
    6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte',
    21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro', 25: 'veinticinco',
    26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve', 30: 'treinta',
  };

  if (numbers[num] !== undefined) {
    return numbers[num];
  }

  // Para números mayores, intentar construir la palabra
  if (num < 100) {
    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;
    const tensMap: Record<number, string> = { 30: 'treinta', 40: 'cuarenta', 50: 'cincuenta' };
    if (tensMap[tens] && ones > 0) {
      return `${tensMap[tens]} y ${numbers[ones] || ones}`;
    }
  }

  // Si no se puede convertir, devolver como string para que ElevenLabs lo pronuncie
  return num.toString();
}

/**
 * Formatea texto para mejorar pronunciación de números y horarios en TTS.
 * Convierte "2:00 PM" → "dos de la tarde", "50%" → "cincuenta por ciento", etc.
 */
export function formatTextForTTS(text: string): string {
  let formatted = text;

  // ✅ LÓGICA DE RESUMEN INTELIGENTE PARA MENSAJE DE BIENVENIDA
  if (formatted.includes('Soy LIA') && formatted.includes('Planificador de Estudios')) {
    if (formatted.includes('Tienes asignado el siguiente curso')) {
      const courseMatch = formatted.match(/Curso:\s*([^\n•]+)/i);
      const courseName = courseMatch ? courseMatch[1].trim() : 'tu curso asignado';

      let simplified = "Soy Lía, tu asistente de planificación. ";
      simplified += "He analizado tu perfil y veo que tienes asignado el curso de " + courseName + ". ";
      simplified += "¿Te gustaría que programemos sesiones rápidas, normales o largas?";

      return simplified;
    }
  }

  // Marcar números ya procesados para evitar conversiones duplicadas
  const processedMarkers = new Set<string>();

  // 1. Procesar horarios con formato completo primero (2:00 PM → "dos de la tarde")
  formatted = formatted.replace(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM|a\.m\.|p\.m\.)/gi, (match, hour, minute, period) => {
    const marker = `TIME_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const periodText = period.toLowerCase().includes('p') ? 'de la tarde' : 'de la mañana';
    const hourText = numberToWords(h);

    if (m === 0) {
      return `${hourText} ${periodText}`;
    } else {
      const minuteText = numberToWords(m);
      return `${hourText} y ${minuteText} ${periodText}`;
    }
  });

  // 2. Procesar horarios sin minutos (2 PM → "dos de la tarde")
  formatted = formatted.replace(/(\d{1,2})\s+(AM|PM|a\.m\.|p\.m\.)/gi, (match, hour, period) => {
    const marker = `TIME2_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const h = parseInt(hour, 10);
    const periodText = period.toLowerCase().includes('p') ? 'de la tarde' : 'de la mañana';
    const hourText = numberToWords(h);
    return `${hourText} ${periodText}`;
  });

  // 3. Procesar fechas (1 de enero → "primero de enero")
  formatted = formatted.replace(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, (match, day, month) => {
    const marker = `DATE_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const d = parseInt(day, 10);
    const dayText = d === 1 ? 'primero' : numberToWords(d);
    return `${dayText} de ${month}`;
  });

  // 4. Procesar porcentajes (50% → "cincuenta por ciento")
  formatted = formatted.replace(/(\d+)%/g, (match, num) => {
    const marker = `PERCENT_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const number = parseInt(num, 10);
    const numText = numberToWords(number);
    return `${numText} por ciento`;
  });

  // 5. Convertir TODOS los números restantes (1-30) a palabras
  formatted = formatted.replace(/\b(\d{1,2})\b/g, (match, num) => {
    const marker = `NUM_${match}`;
    if (processedMarkers.has(marker)) return match;

    const number = parseInt(num, 10);
    if (number <= 30 && number >= 0) {
      processedMarkers.add(marker);
      return numberToWords(number);
    }
    return match;
  });

  // 6. Mejorar números en formato de lista o enumeración (1., 2., etc.)
  formatted = formatted.replace(/(\d{1,2})\.\s/g, (match, num) => {
    const number = parseInt(num, 10);
    if (number <= 30) {
      return `${numberToWords(number)}. `;
    }
    return match;
  });

  // 7. Normalizar espacios múltiples y limpiar
  formatted = formatted.replace(/\s+/g, ' ');
  formatted = formatted.replace(/\s+([.,;:!?])/g, '$1');
  formatted = formatted.replace(/([.,;:!?])\s*([.,;:!?])/g, '$1 $2');

  return formatted.trim();
}

// =============================================================================
// HOOK
// =============================================================================

export function useVoiceEngine(
  callbacks: VoiceEngineCallbacks = {}
): VoiceEngineState & VoiceEngineActions {
  // ----- Estado -----
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');

  // ----- Refs -----
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });
  const processingRef = useRef<boolean>(false);
  const pendingTranscriptRef = useRef<string | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const lastErrorTimeRef = useRef<number>(0);

  // Ref estable para callbacks (evita re-registrar listeners)
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // ----- stopAll -----
  const stopAll = useCallback(() => {
    console.log('🛑 [stopAllAudio] Deteniendo todo el audio...');
    try {
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort(); } catch (e) { /* ignore */ }
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
    } catch (err) {
      console.warn('Error deteniendo audio:', err);
    }
  }, []);

  // ----- speak (ElevenLabs TTS + Web Speech API fallback) -----
  const speak = useCallback(async (text: string, forceEnable = false) => {
    if ((!isAudioEnabled && !forceEnable) || typeof window === 'undefined') return;

    stopAll();

    try {
      setIsSpeaking(true);

      const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
      const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'ay4iqk10DLwc8KGSrf2t';
      const modelId = 'eleven_turbo_v2_5';

      if (!apiKey || !voiceId) {
        console.warn('⚠️ ElevenLabs credentials not found, using fallback Web Speech API');

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      }

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      // Formatear el texto para mejorar pronunciación de números y horarios
      const formattedText = formatTextForTTS(text);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          signal: controller.signal,
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text: formattedText,
            model_id: modelId || 'eleven_turbo_v2_5',
            voice_settings: {
              stability: ELEVENLABS_CONFIG.stability,
              similarity_boost: ELEVENLABS_CONFIG.similarity_boost,
              style: ELEVENLABS_CONFIG.style,
              use_speaker_boost: ELEVENLABS_CONFIG.use_speaker_boost,
            },
            speed: ELEVENLABS_CONFIG.speed,
            optimize_streaming_latency: 4,
            output_format: 'mp3_22050_32',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();

      // ✅ FIX: Verificar rigurosamente si se canceló la reproducción
      if (!ttsAbortRef.current || ttsAbortRef.current !== controller || controller.signal.aborted) {
        console.log('🔇 [speakText] Reproducción abortada antes de iniciar audio (silenciado o cancelado).');
        if (ttsAbortRef.current === controller) {
          ttsAbortRef.current = null;
        }
        return;
      }
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.volume = 0.8;
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      try {
        console.log('🔊 [speakText] Iniciando reproducción de audio...');
        await audio.play();
        if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
      } catch (playError: any) {
        console.error('❌ [speakText] Error al reproducir audio:', playError);
        setIsSpeaking(false);
      }
    } catch (error: any) {
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        // Silently ignore AbortErrors
      } else {
        console.error('Error en síntesis de voz con ElevenLabs:', error);
      }
      setIsSpeaking(false);
    }
  }, [isAudioEnabled, stopAll]);

  // ----- Speech Recognition initialization -----
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const speechToTextRaw = event.results[0][0].transcript || '';
          const speechToText = speechToTextRaw.trim();

          const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
          const norm = normalize(speechToText);

          if (norm.length < 2) {
            console.warn('Transcripción demasiado corta, ignorando.');
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
            if (lastTranscriptRef.current.text === norm && now - lastTranscriptRef.current.ts < 3000) {
              console.warn('Resultado duplicado detectado, ignorando.');
              setIsListening(false);
              return;
            }

            if (processingRef.current) {
              console.warn('Reconocimiento produjo resultado pero ya hay procesamiento en curso, ignorando.');
              setIsListening(false);
              return;
            }

            lastTranscriptRef.current = { text: norm, ts: now };

            const finalTranscript = pendingTranscriptRef.current || speechToText;
            pendingTranscriptRef.current = null;

            setTranscript(finalTranscript);
            setIsListening(false);

            // Delegar procesamiento al componente padre vía callback
            callbacksRef.current.onTranscriptReady?.(finalTranscript);
          }, 350);
        };

        const ERROR_DEBOUNCE_MS = 2000;

        recognition.onerror = (event: any) => {
          const errorType = event.error || 'unknown';
          const now = Date.now();

          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          } catch (e) { /* ignore */ }

          setIsListening(false);

          if (now - lastErrorTimeRef.current < ERROR_DEBOUNCE_MS && errorType === 'network') {
            return;
          }
          lastErrorTimeRef.current = now;

          if (errorType === 'not-allowed') {
            alert('Necesito permiso para usar el micrófono.\n\nPor favor:\n1. Haz clic en el icono de micrófono en la barra de direcciones\n2. Permite el acceso al micrófono\n3. Intenta de nuevo');
          }
        };

        recognitionRef.current = recognition;
      } else {
        console.warn('El navegador no soporta reconocimiento de voz');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // ----- toggleListening -----
  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome, Edge o Safari.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) { /* ignore */ }
      setIsListening(false);
    } else {
      stopAll();

      try {
        try {
          recognitionRef.current.stop();
        } catch (e) { /* ignore */ }

        await new Promise(resolve => setTimeout(resolve, 100));

        await navigator.mediaDevices.getUserMedia({ audio: true });

        setTranscript('');

        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (startError: any) {
          if (startError.message?.includes('already started')) {
            setIsListening(true);
          } else {
            throw startError;
          }
        }
      } catch (error: any) {
        console.error('Error al solicitar permisos de micrófono:', error);
        setIsListening(false);

        if (error?.name === 'NotAllowedError') {
          alert('Necesito permiso para usar el micrófono.\n\nPor favor permite el acceso al micrófono en tu navegador y vuelve a intentar.');
        }
      }
    }
  }, [isListening, stopAll]);

  // ----- toggleAudio -----
  const toggleAudio = useCallback((speakOnEnable?: string) => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);

    if (!newState) {
      stopAll();
    } else if (speakOnEnable) {
      speak(speakOnEnable, true);
    }
  }, [isAudioEnabled, stopAll, speak]);

  return {
    // Estado
    isListening,
    isSpeaking,
    isAudioEnabled,
    transcript,
    // Acciones
    speak,
    stopAll,
    toggleListening,
    toggleAudio,
    processingRef,
  };
}

export default useVoiceEngine;
