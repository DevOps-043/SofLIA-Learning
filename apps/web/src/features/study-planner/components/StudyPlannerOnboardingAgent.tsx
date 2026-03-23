'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Volume2,
  VolumeX,
  ChevronRight,
  Calendar,
  Shield,
  Lock,
  Unlink,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  speech: string;
  icon: React.ReactNode;
}

const STORAGE_KEY = 'has-seen-study-planner-onboarding';

// Pasos del tour para Study Planner
function useStudyPlannerOnboardingSteps() {
  return useMemo(() => [
    {
      id: 1,
      title: 'Planificador de Estudios Inteligente',
      description: 'Estamos a punto de crear tu plan de estudios personalizado. Para hacerlo de la mejor manera, necesito acceder a tu calendario.',
      speech: 'Bienvenido al Planificador de Estudios Inteligente. Estamos a punto de crear tu plan de estudios completamente personalizado. Para hacerlo de la mejor manera posible, necesito acceder a tu calendario.',
      icon: <Calendar className="w-6 h-6" />
    },
    {
      id: 2,
      title: '¿Por qué conectar tu calendario?',
      description: 'Al conectar tu calendario de Google o Microsoft, podré ver tus horarios ocupados y encontrar los mejores momentos para tus sesiones de estudio.',
      speech: 'Al conectar tu calendario de Google o Microsoft, podré analizar tus horarios ocupados y encontrar automáticamente los mejores momentos para tus sesiones de estudio, sin que tengas que ingresarlos manualmente.',
      icon: <Calendar className="w-6 h-6" />
    },
    {
      id: 3,
      title: 'Tu privacidad es nuestra prioridad',
      description: 'Solo accedemos a la información de horarios ocupados. No leemos el contenido de tus eventos, solo verificamos cuándo estás disponible.',
      speech: 'Tu privacidad es nuestra máxima prioridad. Solo accedemos a la información básica de horarios ocupados. No leemos el contenido de tus eventos personales ni laborales, únicamente verificamos cuándo estás disponible.',
      icon: <Shield className="w-6 h-6" />
    },
    {
      id: 4,
      title: 'Tus datos son confidenciales',
      description: 'Toda la información se procesa de forma segura y encriptada. No compartimos tus datos con terceros bajo ninguna circunstancia.',
      speech: 'Toda la información de tu calendario se procesa de forma segura y completamente encriptada. No compartimos tus datos con terceros bajo ninguna circunstancia. Tu información permanece confidencial siempre.',
      icon: <Lock className="w-6 h-6" />
    },
    {
      id: 5,
      title: 'Tú tienes el control',
      description: 'Puedes desconectar tu calendario en cualquier momento desde la configuración. Al hacerlo, eliminaremos toda la información almacenada.',
      speech: 'Tú tienes el control total. Puedes desconectar tu calendario en cualquier momento desde la configuración de tu cuenta. Al hacerlo, eliminaremos automáticamente toda la información que hayamos almacenado.',
      icon: <Unlink className="w-6 h-6" />
    },
    {
      id: 6,
      title: '¿Conectamos tu calendario?',
      description: 'Conectar tu calendario nos permitirá crear el plan de estudios perfecto para ti. ¿Te gustaría conectarlo ahora?',
      speech: 'Conectar tu calendario nos permitirá crear el plan de estudios perfecto adaptado a tu vida real. ¿Te gustaría conectarlo ahora?',
      icon: <CheckCircle2 className="w-6 h-6" />
    }
  ] as OnboardingStep[], []);
}

export function StudyPlannerOnboardingAgent() {
  const ONBOARDING_STEPS = useStudyPlannerOnboardingSteps();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'microsoft' | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const hasAttemptedOpenRef = useRef<boolean>(false);
  const isOpeningRef = useRef<boolean>(false);

  // Detiene todo audio/voz en reproducción
  const stopAllAudio = () => {
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

  // Verificar si es la primera visita - se ejecuta SOLO al montar
  useEffect(() => {
    // Si ya se intentó abrir o está visible, no hacer nada
    if (isOpeningRef.current || hasAttemptedOpenRef.current) {
      return;
    }

    const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);

    if (!hasSeenOnboarding) {
      hasAttemptedOpenRef.current = true;
      isOpeningRef.current = true;

      // Verificar si viene del tour del Business User para reducir el delay
      const comingFromBusinessTour = localStorage.getItem('coming-from-business-tour');
      const delay = comingFromBusinessTour === 'true' ? 500 : 1200;

      // Limpiar el flag si existe
      if (comingFromBusinessTour) {
        localStorage.removeItem('coming-from-business-tour');
      }

      setTimeout(() => {
        const stillHasntSeen = localStorage.getItem(STORAGE_KEY) !== 'true';
        if (stillHasntSeen) {
          setIsVisible(true);
        }
        isOpeningRef.current = false;
      }, delay);
    } else {
      hasAttemptedOpenRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependency array vacío - ejecutar SOLO al montar

  // Listener para abrir el modal manualmente
  useEffect(() => {
    const handleOpenOnboarding = () => {
      hasAttemptedOpenRef.current = false;
      isOpeningRef.current = true;

      setIsVisible(true);
      setCurrentStep(0);
      setShowCalendarOptions(false);

      setTimeout(() => {
        isOpeningRef.current = false;
      }, 100);
    };

    window.addEventListener('open-study-planner-onboarding', handleOpenOnboarding);

    return () => {
      window.removeEventListener('open-study-planner-onboarding', handleOpenOnboarding);
    };
  }, []);

  // Reproducir audio automáticamente cuando se abre el modal
  useEffect(() => {
    if (isVisible && currentStep === 0 && isAudioEnabled) {
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

    stopAllAudio();

    try {
      setIsSpeaking(true);

      const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
      const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'ay4iqk10DLwc8KGSrf2t';
      const modelId = 'eleven_turbo_v2_5';

      if (!apiKey || !voiceId) {
        // Fallback a Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.3;

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
            model_id: modelId,
            voice_settings: {
              stability: 0.4,
              similarity_boost: 0.65,
              style: 0.3,
              use_speaker_boost: false
            },
            optimize_streaming_latency: 4,
            output_format: 'mp3_22050_32'
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      if (ttsAbortRef.current && ttsAbortRef.current.signal.aborted) {
        ttsAbortRef.current = null;
        return;
      }
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
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
        await audio.play();
        if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
      } catch (playError: any) {
        setIsSpeaking(false);
      }
    } catch (error: any) {
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        // Abortado intencionalmente
      } else {
        console.error('Error en síntesis de voz:', error);
      }
      setIsSpeaking(false);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const handleNext = () => {
    stopAllAudio();
    setHasUserInteracted(true);

    const nextStep = currentStep + 1;

    if (nextStep < ONBOARDING_STEPS.length) {
      setCurrentStep(nextStep);
      speakText(ONBOARDING_STEPS[nextStep].speech);
    }
  };

  const handlePrevious = () => {
    stopAllAudio();

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
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
      hasAttemptedOpenRef.current = true;
    }
  };

  const handleDecline = () => {
    stopAllAudio();
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
      hasAttemptedOpenRef.current = true;
    }
  };

  const handleAcceptConnect = () => {
    stopAllAudio();
    setShowCalendarOptions(true);
  };

  const handleConnectCalendar = async (provider: 'google' | 'microsoft') => {
    setConnectingProvider(provider);

    try {
      const response = await fetch('/api/study-planner/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la conexión');
      }

      const data = await response.json();

      if (data.success && data.data?.authUrl) {
        // Guardar que ya vio el onboarding antes de redirigir
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, 'true');
        }
        // Redirigir a la autenticación
        window.location.href = data.data.authUrl;
      }
    } catch (err) {
      console.error('Error conectando calendario:', err);
      setConnectingProvider(null);
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
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md z-[9998]"
            onClick={handleSkip}
          />

          {/* Contenedor principal */}
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
              {/* Esfera animada estilo JARVIS */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                {/* Esfera central con anillos */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-1.5 sm:mb-2 md:mb-3">
                  {/* Esfera central con foto de SofLIA */}
                  <motion.div
                    className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-1 overflow-hidden"
                    animate={{
                      scale: isSpeaking ? [1, 1.08, 1] : 1,
                      boxShadow: isSpeaking
                        ? [
                            '0 0 30px rgba(99, 102, 241, 0.6)',
                            '0 0 80px rgba(139, 92, 246, 0.9)',
                            '0 0 30px rgba(99, 102, 241, 0.6)',
                          ]
                        : '0 0 50px rgba(99, 102, 241, 0.7)'
                    }}
                    transition={{
                      scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
                      boxShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  >
                    {/* Foto de SofLIA */}
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
                      <Image
                        src="/lia-avatar.png"
                        alt="SofLIA"
                        fill
                        sizes="256px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </motion.div>

                  {/* Partículas flotantes */}
                  {[...Array(8)].map((_, i) => {
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

                  {/* Pulso de voz cuando está hablando */}
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

                {/* Panel de contenido */}
                <motion.div
                  key={showCalendarOptions ? 'calendar-options' : currentStep}
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
                  {/* Efecto de brillo animado */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)',
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
                    {/* Botones de control */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1 sm:gap-1.5">
                      <motion.button
                        onClick={toggleAudio}
                        whileHover={{
                          scale: 1.15,
                          rotate: [0, -10, 10, -10, 0],
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 17,
                          rotate: { duration: 0.5 }
                        }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-lg overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-indigo-500/10 rounded-full"
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

                    {showCalendarOptions ? (
                      // Pantalla de selección de calendario
                      <>
                        <div className="flex justify-center mb-2">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                          >
                            <Calendar className="w-6 h-6" />
                          </motion.div>
                        </div>

                        <div className="text-center space-y-3 sm:space-y-4">
                          <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
                          >
                            Selecciona tu calendario
                          </motion.h2>

                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-600 dark:text-gray-400 text-sm"
                          >
                            Elige el servicio de calendario que deseas conectar:
                          </motion.p>

                          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm mx-auto">
                            {/* Google Calendar */}
                            <motion.button
                              onClick={() => handleConnectCalendar('google')}
                              disabled={connectingProvider !== null}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {connectingProvider === 'google' ? (
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                              ) : (
                                <svg viewBox="0 0 24 24" className="w-10 h-10">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              )}
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                Google Calendar
                              </span>
                            </motion.button>

                            {/* Microsoft Calendar */}
                            <motion.button
                              onClick={() => handleConnectCalendar('microsoft')}
                              disabled={connectingProvider !== null}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {connectingProvider === 'microsoft' ? (
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                              ) : (
                                <svg viewBox="0 0 24 24" className="w-10 h-10">
                                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                                  <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                                  <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                                </svg>
                              )}
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                Microsoft
                              </span>
                            </motion.button>
                          </div>

                          <motion.button
                            onClick={() => setShowCalendarOptions(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2"
                          >
                            ← Volver
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      // Pasos normales del tour
                      <>
                        {/* Indicador de progreso */}
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
                                    ? 'w-6 sm:w-8 md:w-10 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/50'
                                    : idx < currentStep
                                    ? 'w-4 sm:w-5 md:w-6 bg-gradient-to-r from-green-500 to-emerald-500'
                                    : 'w-4 sm:w-5 md:w-6 bg-gray-300 dark:bg-gray-600'
                                }`}
                                animate={idx === currentStep ? {
                                  scale: [1, 1.15, 1],
                                  boxShadow: [
                                    '0 0 0px rgba(99, 102, 241, 0.5)',
                                    '0 0 20px rgba(139, 92, 246, 0.8)',
                                    '0 0 0px rgba(99, 102, 241, 0.5)',
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
                                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 blur-md opacity-50"
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

                        {/* Icono del paso */}
                        <div className="flex justify-center mb-2">
                          <motion.div
                            key={`icon-${currentStep}`}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                          >
                            {step.icon}
                          </motion.div>
                        </div>

                        {/* Contenido del paso */}
                        <div className="text-center space-y-1.5 sm:space-y-2">
                          <motion.h2
                            key={`title-${currentStep}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight px-2"
                          >
                            {step.title}
                          </motion.h2>

                          <motion.p
                            key={`description-${currentStep}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-light px-2"
                          >
                            {step.description}
                          </motion.p>
                        </div>

                        {/* Botones de navegación */}
                        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-2 sm:mt-3 md:mt-4">
                          {currentStep > 0 && !isLastStep && (
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
                              className="relative w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors shadow-md border border-gray-200 dark:border-gray-600 text-xs sm:text-sm overflow-hidden group"
                            >
                              <span className="relative z-10">Anterior</span>
                            </motion.button>
                          )}

                          {isLastStep ? (
                            // Botones del último paso: Aceptar o Rechazar
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <motion.button
                                onClick={handleDecline}
                                whileHover={{
                                  scale: 1.05,
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors shadow-md border border-gray-200 dark:border-gray-600 text-xs sm:text-sm"
                              >
                                Ahora no
                              </motion.button>

                              <motion.button
                                onClick={handleAcceptConnect}
                                whileHover={{
                                  scale: 1.08,
                                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                                }}
                                whileTap={{ scale: 0.92 }}
                                className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-indigo-500/30 text-xs sm:text-sm overflow-hidden group"
                              >
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                                  initial={{ x: '-100%' }}
                                  whileHover={{ x: '100%' }}
                                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                                />
                                <Calendar size={16} className="relative z-10" />
                                <span className="relative z-10">Sí, conectar calendario</span>
                              </motion.button>
                            </div>
                          ) : (
                            <motion.button
                              onClick={handleNext}
                              whileHover={{
                                scale: 1.08,
                                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                              }}
                              whileTap={{ scale: 0.92 }}
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 17
                              }}
                              className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/20 text-xs sm:text-sm overflow-hidden group"
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                                initial={{ x: '-100%' }}
                                whileHover={{ x: '100%' }}
                                transition={{ duration: 0.6, ease: 'easeInOut' }}
                              />
                              <span className="relative z-10">Siguiente</span>
                              <motion.span
                                className="relative z-10"
                                whileHover={{ x: 4 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                              >
                                <ChevronRight size={16} className="sm:w-4 sm:h-4" />
                              </motion.span>
                            </motion.button>
                          )}
                        </div>

                        {/* Botón de saltar */}
                        {!isLastStep && (
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
                              className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-xs sm:text-sm transition-colors font-medium group"
                            >
                              <span className="relative z-10">Saltar introducción</span>
                              <motion.div
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 dark:bg-gray-500"
                                initial={{ scaleX: 0 }}
                                whileHover={{ scaleX: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            </motion.button>
                          </motion.div>
                        )}
                      </>
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

// Función para resetear el onboarding (útil para testing)
export function resetStudyPlannerOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Función para abrir el onboarding manualmente
export function openStudyPlannerOnboarding() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-study-planner-onboarding'));
  }
}
