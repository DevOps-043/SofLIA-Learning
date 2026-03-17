'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ChevronRight, Mic, MicOff } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/I18nProvider';
import { ContextualVoiceGuideProps, VoiceGuideStep } from './types';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { getPlatformContext, getAvailableLinksForLIA } from '../../../lib/lia/page-metadata';

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

export function ContextualVoiceGuide({
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
      // console.log('ElevenLabs Config (OPTIMIZED):', { 
      //   apiKey: apiKey.substring(0, 15) + '...', 
      //   voiceId,
      //   modelId
      // });

      if (!apiKey || !voiceId) {
        console.warn('âš ï¸ ElevenLabs credentials not found, using fallback Web Speech API');
        
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

      } else {
        console.error('Error en síntesis de voz con ElevenLabs:', error);
      }
      setIsSpeaking(false);
    }
  };

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
      const availableLinks = getAvailableLinksForLIA ? getAvailableLinksForLIA() : undefined;

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
      console.error('âŒ Error procesando pregunta:', error);
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

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay mejorado con gradiente */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md z-[9998]"
            // onClick removido para que solo se cierre con botones
          />

          {/* Contenedor principal sin scroll */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                duration: 0.6 
              }}
              className="relative max-w-4xl w-full pointer-events-auto max-h-[95vh] flex flex-col items-center justify-center"
            >
              {/* Esfera animada estilo JARVIS - Más compacta */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                {/* Esfera central con anillos - Más pequeña para pantallas pequeñas */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-1.5 sm:mb-2 md:mb-3">
                  {/* Esfera central con foto de LIA - Más compacta */}
                  <motion.div
                    className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-[#0A2540] via-[#00D4B3] to-[#0A2540] p-1 overflow-hidden"
                    animate={{ 
                      scale: isSpeaking ? [1, 1.08, 1] : 1,
                      boxShadow: isSpeaking 
                        ? [
                            '0 0 30px rgba(10, 37, 64, 0.6)',
                            '0 0 80px rgba(0, 212, 179, 0.9)',
                            '0 0 30px rgba(10, 37, 64, 0.6)',
                          ]
                        : '0 0 50px rgba(0, 212, 179, 0.7)'
                    }}
                    transition={{ 
                      scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
                      boxShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  >
                    {/* Foto de LIA */}
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
                      <Image
                        src="/lia-avatar.png"
                        alt="LIA"
                        fill
                        sizes="256px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </motion.div>

                  {/* Partículas flotantes - Más pequeñas y compactas */}
                  {[...Array(8)].map((_, i) => {
                    // Radio más pequeño para pantallas pequeñas
                    const radius = isMobile ? 50 : 70;
                    return (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                        }}
                        animate={{
                          x: [0, Math.cos(i * 45 * Math.PI / 180) * radius],
                          y: [0, Math.sin(i * 45 * Math.PI / 180) * radius],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: 'easeOut'
                        }}
                      />
                    );
                  })}

                  {/* Pulso de voz cuando está hablando - Más compacto */}
                  {isSpeaking && (
                    <motion.div
                      className="absolute inset-6 sm:inset-8 rounded-full border-2 border-white/50"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                </div>

                {/* Panel de contenido - Más compacto sin scroll */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30,
                    duration: 0.5
                  }}
                  className="relative bg-gradient-to-br from-white/95 via-white/90 to-white/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-2.5 sm:p-3 md:p-4 w-full overflow-hidden flex-shrink min-h-0"
                >
                  {/* Efecto de brillo animado en el borde */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(10, 37, 64, 0.1) 0%, rgba(0, 212, 179, 0.1) 50%, rgba(10, 37, 64, 0.1) 100%)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />

                  {/* Patrón de fondo sutil */}
                  <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                      backgroundSize: '40px 40px',
                    }} />
                  </div>

                  {/* Contenido relativo */}
                  <div className="relative z-10">
                    {/* Botones de control - Con animaciones mejoradas */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1 sm:gap-1.5">
                      <motion.button
                        onClick={toggleAudio}
                        whileHover={{ 
                          scale: 1.15,
                          rotate: [0, -10, 10, -10, 0],
                          boxShadow: '0 4px 12px rgba(0, 212, 179, 0.3)'
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 17,
                          rotate: { duration: 0.5 }
                        }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-[#1E2329]/80 backdrop-blur-sm border border-[#E9ECEF]/50 dark:border-[#6C757D]/30 hover:bg-white dark:hover:bg-[#0A2540]/30 transition-colors text-[#6C757D] dark:text-white/60 hover:text-[#00D4B3] dark:hover:text-[#00D4B3] shadow-lg overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-[#00D4B3]/10 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1.5, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.span
                          className="relative z-10"
                          animate={isSpeaking ? {
                            scale: [1, 1.2, 1],
                          } : {}}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          {isAudioEnabled ? <Volume2 size={14} className="sm:w-4 sm:h-4" /> : <VolumeX size={14} className="sm:w-4 sm:h-4" />}
                        </motion.span>
                      </motion.button>
                      <motion.button
                        onClick={handleSkip}
                        whileHover={{ 
                          scale: 1.15,
                          rotate: 90,
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 17,
                          rotate: { duration: 0.3 }
                        }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 shadow-lg overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-red-500/10 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1.5, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="relative z-10">
                          <X size={14} className="sm:w-4 sm:h-4" />
                        </span>
                      </motion.button>
                    </div>

                    {/* Indicador de progreso - Más compacto */}
                    <div className="flex gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 md:mb-3 justify-center items-center">
                      {ONBOARDING_STEPS.map((_, idx) => (
                        <motion.div
                          key={idx}
                          className="relative"
                          whileHover={{ scale: 1.2 }}
                        >
                          <motion.div
                            className={`h-1 sm:h-1.5 rounded-full transition-all ${
                              idx === currentStep 
                                ? 'w-6 sm:w-8 md:w-10 bg-gradient-to-r from-[#0A2540] via-[#00D4B3] to-[#0A2540] shadow-lg shadow-[#00D4B3]/50' 
                                : idx < currentStep 
                                ? 'w-4 sm:w-5 md:w-6 bg-gradient-to-r from-[#10B981] to-[#10B981]' 
                                : 'w-4 sm:w-5 md:w-6 bg-[#E9ECEF] dark:bg-[#6C757D]/30'
                            }`}
                            animate={idx === currentStep ? {
                              scale: [1, 1.15, 1],
                              boxShadow: [
                                '0 0 0px rgba(0, 212, 179, 0.5)',
                                '0 0 20px rgba(0, 212, 179, 0.8)',
                                '0 0 0px rgba(0, 212, 179, 0.5)',
                              ]
                            } : {}}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          />
                          {idx === currentStep && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0A2540] to-[#00D4B3] blur-md opacity-50"
                              animate={{
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                              }}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Contenido del paso - Más compacto */}
                    <div className="text-center space-y-1.5 sm:space-y-2">
                      <motion.h2
                        key={`title-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-[#0A2540] via-[#1a4666] to-[#0A2540] dark:from-[#00D4B3] dark:via-[#00D4B3] dark:to-[#00D4B3] bg-clip-text text-transparent leading-tight px-2"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                      >
                        {step.title}
                      </motion.h2>
                      
                      <motion.p
                        key={`description-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-gray-700 dark:text-gray-200 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-light px-2"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        {step.description}
                      </motion.p>

                  </div>

                    {/* Botones de navegación - Con animaciones mejoradas */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-2 sm:mt-3 md:mt-4">
                      {currentStep > 0 && (
                        <motion.button
                          onClick={handlePrevious}
                          whileHover={{ 
                            scale: 1.08, 
                            x: -4,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-[#E9ECEF] dark:bg-[#1E2329] hover:bg-[#E9ECEF]/80 dark:hover:bg-[#0A2540]/30 text-[#0A2540] dark:text-white font-medium transition-colors shadow-md border border-[#E9ECEF] dark:border-[#6C757D]/30 text-xs sm:text-sm overflow-hidden group"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-[#E9ECEF]/0 via-[#E9ECEF]/50 to-[#E9ECEF]/0 dark:from-[#0A2540]/0 dark:via-[#0A2540]/50 dark:to-[#0A2540]/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">{t('onboarding.buttons.previous')}</span>
                        </motion.button>
                      )}

                      {/* Solo mostrar el botón de acción si NO es el último paso */}
                      {step.action && currentStep < ONBOARDING_STEPS.length - 1 && (
                        <motion.button
                          onClick={handleActionClick}
                          whileHover={{ 
                            scale: 1.08,
                            boxShadow: '0 8px 24px rgba(0, 212, 179, 0.4)',
                          }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-[#0A2540]/30 dark:shadow-[#0A2540]/20 text-xs sm:text-sm overflow-hidden group"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">{step.action.label}</span>
                          <motion.span
                            className="relative z-10"
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <ChevronRight size={16} className="sm:w-4 sm:h-4" />
                          </motion.span>
                        </motion.button>
                      )}

                      {currentStep < ONBOARDING_STEPS.length - 1 ? (
                        <motion.button
                          onClick={handleNext}
                          whileHover={{ 
                            scale: 1.08,
                            boxShadow: '0 8px 24px rgba(0, 212, 179, 0.4)',
                          }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-[#0A2540]/30 dark:shadow-[#0A2540]/20 text-xs sm:text-sm overflow-hidden group"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">{t('onboarding.buttons.next')}</span>
                          <motion.span
                            className="relative z-10"
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <ChevronRight size={16} className="sm:w-4 sm:h-4" />
                          </motion.span>
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={handleComplete}
                          whileHover={{ 
                            scale: 1.1,
                            boxShadow: '0 10px 30px rgba(34, 197, 94, 0.5)',
                          }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold shadow-xl shadow-green-500/30 dark:shadow-green-500/20 text-sm sm:text-base overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.7, ease: 'easeInOut' }}
                          />
                          <motion.span
                            className="relative z-10"
                            animate={{
                              scale: [1, 1.05],
                            }}
                            transition={{
                              type: 'tween',
                              duration: 2,
                              repeat: Infinity,
                              repeatType: 'reverse',
                              ease: 'easeInOut'
                            }}
                          >
                            {t('onboarding.buttons.start')}
                          </motion.span>
                        </motion.button>
                      )}
                    </div>

                    {/* Botón de saltar - Con animación mejorada */}
                    {currentStep < ONBOARDING_STEPS.length - 1 && (
                      <motion.div
                        className="text-center mt-2 sm:mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.button
                          onClick={handleSkip}
                          whileHover={{ 
                            scale: 1.05,
                            y: -2
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs sm:text-sm transition-colors font-medium group"
                        >
                          <span className="relative z-10">{t('onboarding.buttons.skipIntro')}</span>
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 dark:bg-gray-500"
                            initial={{ scaleX: 0 }}
                            whileHover={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
