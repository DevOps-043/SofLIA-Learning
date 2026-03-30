'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../providers/I18nProvider';
import { ContextualVoiceGuideProps } from '../types';
import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { getPlatformContext, getAvailableLinksForSofLIA } from '../../../../lib/lia/page-metadata';

// Función para detectar automáticamente el contexto basado en la URL
function detectContextFromURL(pathname: string): string {
  if (pathname.includes('/communities')) return 'communities';
  if (pathname.includes('/courses')) return 'courses';
  if (pathname.includes('/workshops')) return 'workshops';
  if (pathname.includes('/news')) return 'news';
  if (pathname.includes('/dashboard')) return 'dashboard';
  if (pathname.includes('/prompt-directory')) return 'prompts';
  if (pathname.includes('/business-panel')) return 'business';
  if (pathname.includes('/profile')) return 'profile';
  return 'general';
}

// Función para obtener información contextual detallada de la página actual
function getPageContextInfo(pathname: string): string {
  const contextMap: Record<string, string> = {
    '/communities': 'página de comunidades - donde los usuarios pueden unirse y participar en grupos',
    '/courses': 'página de cursos - catálogo de cursos disponibles para aprendizaje',
    '/workshops': 'página de talleres - eventos y sesiones de formación',
    '/news': 'página de noticias - últimas actualizaciones y anuncios',
    '/dashboard': 'panel principal del usuario - catálogo completo de talleres y cursos disponibles',
    '/prompt-directory': 'directorio de prompts - colección de plantillas de prompts de IA',
    '/business-panel': 'panel de negocios - herramientas para empresas',
    '/profile': 'página de perfil de usuario',
  };

  // Buscar coincidencia exacta primero
  if (contextMap[pathname]) {
    return contextMap[pathname];
  }

  // Buscar coincidencia parcial
  for (const [path, description] of Object.entries(contextMap)) {
    if (pathname.includes(path)) {
      return description;
    }
  }

  return 'página principal de la plataforma';
}

export function useContextualVoiceGuideLogic({
  tourId,
  steps,
  triggerPaths,
  isReplayable = true,
  showDelay = 1000,
  requireAuth = false,
}: ContextualVoiceGuideProps) {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const ONBOARDING_STEPS = steps;

  // 🎙️ Mapeo de idiomas para reconocimiento de voz
  const speechLanguageMap: Record<string, string> = {
    'es': 'es-ES',
    'en': 'en-US',
    'pt': 'pt-BR'
  };
  const storageKey = `has-seen-tour-${tourId}`;
  const conversationStorageKey = `lia-conversation-history`; // Clave para persistir historial de conversación

  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Estados para conversación por voz
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Cargar historial de conversación desde sessionStorage para mantener contexto entre páginas
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(conversationStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Error cargando historial de LIA:', e);
      }
    }
    return [];
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });
  const processingRef = useRef<boolean>(false);
  const pendingTranscriptRef = useRef<string | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const conversationHistoryRef = useRef(conversationHistory);
  const lastErrorTimeRef = useRef<number>(0);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const hasAttemptedOpenRef = useRef<boolean>(false); // Para evitar aperturas múltiples
  const isOpeningRef = useRef<boolean>(false); // Para evitar aperturas simultáneas
  const lastPathnameRef = useRef<string>(''); // Para detectar cambios reales de pathname

  // Detiene todo audio/voz en reproducción (ElevenLabs audio y SpeechSynthesis)
  const stopAllAudio = () => {
    try {
      // Abort any in-flight TTS fetch
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort(); } catch (e) { /* ignore */ }
        ttsAbortRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        // Cancelar cualquier utterance en curso
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }

      setIsSpeaking(false);
    } catch (err) {
      console.warn('Error deteniendo audio:', err);
    }
  };

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Persistir historial de conversación en sessionStorage para mantener contexto entre páginas
  useEffect(() => {
    if (typeof window !== 'undefined' && conversationHistory.length > 0) {
      try {
        // Limitar el historial a las últimas 50 entradas para no sobrecargar el storage
        const historyToSave = conversationHistory.slice(-50);
        sessionStorage.setItem(conversationStorageKey, JSON.stringify(historyToSave));
      } catch (e) {
        console.warn('Error guardando historial de LIA:', e);
      }
    }
    // Sincronizar la referencia con el estado
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory, conversationStorageKey]);

  // Verificar si debe mostrar el tour
  useEffect(() => {
    // ✅ CORRECCIÓN: Verificar PRIMERO si el usuario ya vio el tour
    // Si ya lo vio (tiene cualquier valor en localStorage), NUNCA abrir automáticamente
    const hasSeenTour = localStorage.getItem(storageKey);
    if (hasSeenTour) {
      // Marcar que no debemos intentar abrir automáticamente
      hasAttemptedOpenRef.current = true;
      return;
    }

    // Evitar aperturas múltiples
    if (isOpeningRef.current || hasAttemptedOpenRef.current || isVisible) {
      return;
    }

    if (requireAuth && !user) return;

    // Obtener pathname base sin query params para comparación
    const basePathname = pathname?.split('?')[0] || '';
    const lastBasePathname = lastPathnameRef.current?.split('?')[0] || '';

    const shouldShow = triggerPaths.some(path => pathname === path || pathname?.startsWith(path));

    // ✅ CORRECCIÓN: Solo abrir automáticamente si:
    // 1. NO ha visto el tour NUNCA (localStorage es null)
    // 2. Debe mostrarse en esta ruta
    // 3. Es la primera vez que se monta el componente (hasAttemptedOpenRef es false)
    if (shouldShow && !hasSeenTour) {
      // Marcar que ya intentamos abrir (para evitar reaperturas)
      hasAttemptedOpenRef.current = true;
      isOpeningRef.current = true;

      // Guardar el pathname base actual
      lastPathnameRef.current = basePathname;

      // Pequeño delay para que la página cargue primero
      setTimeout(() => {
        // ✅ Verificar nuevamente que no se ha marcado como visto
        const stillHasntSeen = !localStorage.getItem(storageKey);
        if (stillHasntSeen && !isVisible) {
          setIsVisible(true);
          // ✅ Guardar inmediatamente al abrir por primera vez para evitar reaperturas
          localStorage.setItem(storageKey, 'true');
        }
        isOpeningRef.current = false;
      }, showDelay);
    }
  }, [pathname, storageKey, triggerPaths, isReplayable, showDelay, requireAuth, user, isVisible]);

  // ✅ Listener para abrir el tour manualmente (desde "Ver Tour del Curso" u otros botones)
  useEffect(() => {
    const handleOpenTour = () => {
      // ✅ CORRECCIÓN: NO resetear hasAttemptedOpenRef para evitar reaperturas automáticas
      // Solo marcar que estamos abriendo
      isOpeningRef.current = true;

      // Abrir el modal
      setIsVisible(true);
      setCurrentStep(0);

      // Marcar que ya no estamos abriendo
      setTimeout(() => {
        isOpeningRef.current = false;
      }, 100);
    };

    // Escuchar evento personalizado para abrir el tour
    const eventName = `open-tour-${tourId}`;
    window.addEventListener(eventName, handleOpenTour);

    return () => {
      window.removeEventListener(eventName, handleOpenTour);
    };
  }, [tourId]);

  // Función para síntesis de voz con ElevenLabs
  const speakText = async (text: string) => {
    if (!isAudioEnabled || typeof window === 'undefined') return;

    // Asegurar que no haya audio superpuesto
    stopAllAudio();

    try {
      setIsSpeaking(true);

      // Acceder directamente a las variables sin validación previa
      const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
      const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'ay4iqk10DLwc8KGSrf2t';
      // ✅ OPTIMIZACIÓN: Usar modelo turbo para mayor velocidad
      const modelId = 'eleven_turbo_v2_5';

      // Debug: mostrar valores (comentado para reducir logs)

      if (!apiKey || !voiceId) {
        console.warn('âš ï¸ ElevenLabs credentials not found, using fallback Web Speech API');

        // Fallback a Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

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

      // Setup abort controller so we can cancel in-flight TTS requests
      const controller = new AbortController();
      ttsAbortRef.current = controller;

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
            text: text,
            model_id: modelId || 'eleven_turbo_v2_5',
            voice_settings: {
              // ✅ OPTIMIZACIÓN: Configuración ajustada para velocidad
              stability: 0.4,              // Reducido de 0.5 para más velocidad
              similarity_boost: 0.65,      // Reducido de 0.75
              style: 0.3,                  // Reducido de 0.5
              use_speaker_boost: false     // Desactivado para mayor velocidad
            },
            // ✅ OPTIMIZACIÓN: Nuevos parámetros de latencia
            optimize_streaming_latency: 4,  // Máxima optimización (0-4)
            output_format: 'mp3_22050_32'   // Menor bitrate = menor latencia
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      // If the request was aborted, do not proceed
      if (ttsAbortRef.current && ttsAbortRef.current.signal.aborted) {
        ttsAbortRef.current = null;
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

      // Intentar reproducir el audio
      try {
        await audio.play();
        // Playback started successfully; clear abort controller
        if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
      } catch (playError: any) {
        // Autoplay bloqueado por el navegador - esto es normal y esperado
        // El audio se reproducirá cuando el usuario haga clic en un botón
        setIsSpeaking(false);
      }
    } catch (error: any) {
      // Si la petición fue abortada, lo manejamos como info
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        // aborted — no action needed
      } else {
        console.error('Error en síntesis de voz con ElevenLabs:', error);
      }
      setIsSpeaking(false);
    }
  };

  // ✅ Reproducir audio automáticamente cuando se abre el modal
  useEffect(() => {
    if (isVisible && currentStep === 0 && isAudioEnabled) {
      // Pequeño delay para asegurar que el modal esté completamente renderizado
      const timer = setTimeout(() => {
        speakText(ONBOARDING_STEPS[0].speech);
        setHasUserInteracted(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = speechLanguageMap[language] || 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const speechToTextRaw = event.results[0][0].transcript || '';
          const speechToText = speechToTextRaw.trim();

          // Normalizar texto para deduplicación
          const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
          const norm = normalize(speechToText);

          // Ignorar transcripciones demasiado cortas
          if (norm.length < 2) {
            console.warn('Transcripción demasiado corta, ignorando.');
            setIsListening(false);
            return;
          }

          // Guardar como transcripción pendiente y usar un pequeño debounce
          pendingTranscriptRef.current = speechToText;

          // Limpiar timeout anterior
          if (pendingTimeoutRef.current) {
            window.clearTimeout(pendingTimeoutRef.current);
            pendingTimeoutRef.current = null;
          }

          // Ejecutar procesamiento después de un breve retardo; si viene otra onresult este timeout se reiniciará
          pendingTimeoutRef.current = window.setTimeout(() => {
            pendingTimeoutRef.current = null;

            // Revalidar normalizado y evitar duplicados rápidos
            const now = Date.now();
            if (lastTranscriptRef.current.text === norm && now - lastTranscriptRef.current.ts < 3000) {
              console.warn('Resultado duplicado detectado (post-debounce), ignorando.');
              setIsListening(false);
              return;
            }

            // Si ya estamos procesando otra pregunta, ignorar esta
            if (processingRef.current) {
              console.warn('Reconocimiento produjo resultado pero ya hay procesamiento en curso, ignorando.');
              setIsListening(false);
              return;
            }

            // Registrar la transcripción final recibida y procesarla.
            // No marcar processingRef aquí para evitar que handleVoiceQuestion vea
            // la bandera ya establecida y se salga prematuramente; handleVoiceQuestion
            // es responsable de establecer processingRef de forma atómica.
            lastTranscriptRef.current = { text: norm, ts: now };

            const finalTranscript = pendingTranscriptRef.current || speechToText;
            pendingTranscriptRef.current = null;

            setTranscript(finalTranscript);
            setIsListening(false);

            // handleVoiceQuestion liberará processingRef al finalizar
            handleVoiceQuestion(finalTranscript);
          }, 350);
        };

        const ERROR_DEBOUNCE_MS = 2000; // 2 segundos entre errores

        recognition.onerror = (event: any) => {
          const errorType = event.error || 'unknown';
          const now = Date.now();

          // Detener el reconocimiento
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          } catch (e) {
            // Ignorar errores al detener
          }

          setIsListening(false);

          // Evitar spam de errores - solo mostrar si han pasado al menos 2 segundos
          if (now - lastErrorTimeRef.current < ERROR_DEBOUNCE_MS && errorType === 'network') {
            return; // Ignorar errores de red repetidos
          }
          lastErrorTimeRef.current = now;

          // Mostrar mensaje de error específico solo para errores importantes
          if (errorType === 'not-allowed') {
            alert(t('onboarding.voice.micPermissionNeeded'));
          } else if (errorType === 'no-speech') {
            // No mostrar error para no-speech, es normal
          } else if (errorType === 'network') {
            // Solo mostrar una vez, no repetir
            console.warn('Error de red en reconocimiento de voz. Verifica tu conexión a internet.');
          } else if (errorType === 'aborted') {
            // No mostrar error para aborted, es normal cuando se cancela
          } else {
            console.warn(`Error en reconocimiento de voz: ${errorType}`);
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
  }, [language, speechLanguageMap]);

  // Función para iniciar/detener escucha
  const toggleListening = async () => {
    if (!recognitionRef.current) {
      alert(t('onboarding.voice.browserNotSupported'));
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignorar errores al detener
      }
      setIsListening(false);
    } else {
      // ✅ Detener audio de LIA si está hablando antes de que el usuario hable
      stopAllAudio();

      try {
        // Asegurarse de que el reconocimiento esté detenido antes de iniciarlo
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignorar si ya está detenido
        }

        // Pequeño delay para asegurar que se detuvo completamente
        await new Promise(resolve => setTimeout(resolve, 100));

        // Solicitar permisos del micrófono primero
        await navigator.mediaDevices.getUserMedia({ audio: true });

        setTranscript('');

        // Verificar que no esté ya iniciado antes de iniciar
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (startError: any) {
          if (startError.message?.includes('already started')) {
            // Ya está iniciado, solo actualizar el estado
            setIsListening(true);
          } else {
            throw startError;
          }
        }
      } catch (error: any) {
        console.error('Error al solicitar permisos de micrófono:', error);
        setIsListening(false);

        if (error?.name === 'NotAllowedError') {
          alert(t('onboarding.voice.micPermissionNeeded'));
        } else if (error?.message?.includes('already started')) {
          // Ya está iniciado, solo actualizar el estado
          setIsListening(true);
        } else {
          alert(t('onboarding.voice.micError'));
        }
      }
    }
  };

  // Función para procesar pregunta de voz con LIA
  const handleVoiceQuestion = async (question: string) => {
    if (!question.trim()) return;
    // Evitar procesar preguntas en paralelo
    if (processingRef.current) {
      console.warn('Otra pregunta está en curso, ignorando la nueva.');
      return;
    }

    // Detener cualquier audio/voz que esté sonando
    stopAllAudio();

    processingRef.current = true;
    setIsProcessing(true);

    // Evitar preguntas muy similares ya procesadas recientemente
    const lastUserMsg = conversationHistoryRef.current.slice().reverse().find(m => m.role === 'user');
    const now = Date.now();
    if (lastUserMsg) {
      const lastText = lastUserMsg.content || '';
      const recent = now - (lastTranscriptRef.current.ts || 0) < 5000;
      if (recent && (lastText === question || lastText.includes(question) || question.includes(lastText))) {
        console.warn('Pregunta similar ya procesada recientemente, ignorando.');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }
    }

    try {
      // Construir contexto para LIA
      const context = {
        isOnboarding: true,
        currentStep: currentStep + 1,
        totalSteps: ONBOARDING_STEPS.length,
        conversationHistory,
      };

      // ✅ CORRECCIÓN: Construir pageContext correcto con pathname actual
      // Esto permite que Lia sepa exactamente en qué página está el usuario
      const currentPathname = pathname || '/';
      const detectedArea = detectContextFromURL(currentPathname);
      const pageDescription = getPageContextInfo(currentPathname);
      const platformContextStr = getPlatformContext ? getPlatformContext() : undefined;
      const availableLinks = getAvailableLinksForSofLIA ? getAvailableLinksForSofLIA() : undefined;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          context: `tour-${tourId}`,
          conversationHistory: conversationHistory || [],
          userName: undefined,
          pageContext: {
            pathname: currentPathname,
            detectedArea: detectedArea,
            description: pageDescription,
            platformContext: platformContextStr,
            availableLinks: availableLinks
          },
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con LIA');
      }

      const data = await response.json();
      const liaResponse = data.response;

      // Actualizar historial de conversación, evitando duplicados consecutivos
      setConversationHistory(prev => {
        const last = prev[prev.length - 1];
        const lastUser = prev.slice().reverse().find(m => m.role === 'user');

        const shouldAddUser = !(lastUser && lastUser.content === question);
        const shouldAddAssistant = !(last && last.role === 'assistant' && last.content === liaResponse);

        let next = prev.slice();
        if (shouldAddUser) next = [...next, { role: 'user', content: question }];
        if (shouldAddAssistant) next = [...next, { role: 'assistant', content: liaResponse }];
        return next;
      });

      // Reproducir respuesta con ElevenLabs
      await speakText(liaResponse);

    } catch (error) {
      console.error('âŒ Error procesando pregunta:', error);
      const errorMessage = t('onboarding.voice.errorProcessing');
      try { await speakText(errorMessage); } catch(e) { /* ignore */ }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const handleNext = () => {
    // Detener cualquier audio en reproducción
    stopAllAudio();

    // ✅ Ya no necesitamos verificar hasUserInteracted porque el audio se inicia automáticamente
    setHasUserInteracted(true);

    const nextStep = currentStep + 1;

    if (nextStep < ONBOARDING_STEPS.length) {
      setCurrentStep(nextStep);
      speakText(ONBOARDING_STEPS[nextStep].speech);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    // Detener cualquier audio en reproducción
    stopAllAudio();

    // Marcar que el usuario ha interactuado
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      speakText(ONBOARDING_STEPS[prevStep].speech);
    }
  };

  const handleSkip = () => {
    stopAllAudio();
    setIsVisible(false);
    // Guardar inmediatamente en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
      // Marcar que ya intentamos abrir para evitar reaperturas
      hasAttemptedOpenRef.current = true;
    }
  };

  const handleComplete = () => {
    stopAllAudio();
    // Guardar inmediatamente en localStorage antes de navegar
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
      // Marcar que ya intentamos abrir para evitar reaperturas
      hasAttemptedOpenRef.current = true;
    }

    const lastStep = ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];

    setIsVisible(false);

    if (lastStep.action) {
      router.push(lastStep.action.path);
    }
  };

  const handleActionClick = () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.action) {
      stopAllAudio();
      // Guardar inmediatamente en localStorage antes de navegar
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
        // Marcar que ya intentamos abrir para evitar reaperturas
        hasAttemptedOpenRef.current = true;
      }
      setIsVisible(false);
      router.push(step.action.path);
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);

    if (!newState) {
      stopAllAudio();
    } else {
      speakText(ONBOARDING_STEPS[currentStep].speech);
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  return {
    // State
    isVisible,
    currentStep,
    isAudioEnabled,
    isSpeaking,
    hasUserInteracted,
    isMobile,
    isListening,
    transcript,
    isProcessing,
    // Derived values
    step,
    ONBOARDING_STEPS,
    // Handlers
    handleNext,
    handlePrevious,
    handleSkip,
    handleComplete,
    handleActionClick,
    toggleAudio,
    toggleListening,
  };
}
