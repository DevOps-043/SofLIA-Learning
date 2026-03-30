'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  speech: string;
  action?: {
    label: string;
    path: string;
  };
}

// Hook para obtener los pasos traducidos
function useOnboardingSteps() {
  const { t } = useTranslation('common');

  return useMemo(() => [
    {
      id: 1,
      title: t('onboarding.steps.1.title'),
      description: t('onboarding.steps.1.description'),
      speech: t('onboarding.steps.1.speech')
    },
    {
      id: 2,
      title: t('onboarding.steps.2.title'),
      description: t('onboarding.steps.2.description'),
      speech: t('onboarding.steps.2.speech'),
      action: {
        label: t('onboarding.steps.2.actionLabel'),
        path: '/dashboard'
      }
    },
    {
      id: 3,
      title: t('onboarding.steps.3.title'),
      description: t('onboarding.steps.3.description'),
      speech: t('onboarding.steps.3.speech'),
      action: {
        label: t('onboarding.steps.3.actionLabel'),
        path: '/courses'
      }
    },
    {
      id: 4,
      title: t('onboarding.steps.4.title'),
      description: t('onboarding.steps.4.description'),
      speech: t('onboarding.steps.4.speech'),
      action: {
        label: t('onboarding.steps.4.actionLabel'),
        path: '/dashboard'
      }
    }
  ] as OnboardingStep[], [t]);
}

export function OnboardingAgent() {
  const { t } = useTranslation('common');
  const ONBOARDING_STEPS = useOnboardingSteps();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const hasAttemptedOpenRef = useRef<boolean>(false); // Para evitar aperturas múltiples
  const isOpeningRef = useRef<boolean>(false); // Para evitar aperturas simultáneas

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

  // Verificar si es la primera visita
  useEffect(() => {
    // Evitar aperturas múltiples
    if (isOpeningRef.current || hasAttemptedOpenRef.current || isVisible) {
      return;
    }

    const hasSeenOnboarding = localStorage.getItem('has-seen-onboarding');
    
    // Solo mostrar en dashboard y si no ha visto el onboarding
    if (!hasSeenOnboarding && pathname === '/dashboard') {
      // Marcar que ya intentamos abrir
      hasAttemptedOpenRef.current = true;
      isOpeningRef.current = true;
      
      // Pequeño delay para que la página cargue primero
      setTimeout(() => {
        // Verificar nuevamente antes de abrir (por si el usuario lo cerró rápidamente)
        const stillHasntSeen = localStorage.getItem('has-seen-onboarding') !== 'true';
        if (stillHasntSeen && !isVisible) {
          setIsVisible(true);
        }
        isOpeningRef.current = false;
      }, 1000);
    } else {
      // Si ya vio el onboarding, marcar que no debemos intentar abrir
      hasAttemptedOpenRef.current = true;
    }
  }, [pathname, isVisible]);

  // ✅ Listener para abrir el modal manualmente (desde "Ver Tour del Curso" u otros botones)
  useEffect(() => {
    const handleOpenOnboarding = () => {
      // Resetear el flag para permitir apertura manual
      hasAttemptedOpenRef.current = false;
      isOpeningRef.current = true;
      
      // Abrir el modal
      setIsVisible(true);
      setCurrentStep(0);
      
      // Marcar que ya no estamos abriendo
      setTimeout(() => {
        isOpeningRef.current = false;
      }, 100);
    };

    // Escuchar evento personalizado para abrir el onboarding
    window.addEventListener('open-onboarding', handleOpenOnboarding);

    return () => {
      window.removeEventListener('open-onboarding', handleOpenOnboarding);
    };
  }, []);

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

      if (!apiKey || !voiceId) {
        console.warn('⚠️ ElevenLabs credentials not found, using fallback Web Speech API');
        
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
      localStorage.setItem('has-seen-onboarding', 'true');
      // Marcar que ya intentamos abrir para evitar reaperturas
      hasAttemptedOpenRef.current = true;
    }
  };

  const handleComplete = () => {
    stopAllAudio();
    // Guardar inmediatamente en localStorage antes de navegar
    if (typeof window !== 'undefined') {
      localStorage.setItem('has-seen-onboarding', 'true');
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
        localStorage.setItem('has-seen-onboarding', 'true');
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
            onClick={handleSkip}
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
                    className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-1 overflow-hidden"
                    animate={{ 
                      scale: isSpeaking ? [1, 1.08, 1] : 1,
                      boxShadow: isSpeaking 
                        ? [
                            '0 0 30px rgba(59, 130, 246, 0.6)',
                            '0 0 80px rgba(168, 85, 247, 0.9)',
                            '0 0 30px rgba(59, 130, 246, 0.6)',
                          ]
                        : '0 0 50px rgba(139, 92, 246, 0.7)'
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
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
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
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 17,
                          rotate: { duration: 0.5 }
                        }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-lg overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-blue-500/10 rounded-full"
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
                                ? 'w-6 sm:w-8 md:w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 shadow-lg shadow-blue-500/50' 
                                : idx < currentStep 
                                ? 'w-4 sm:w-5 md:w-6 bg-gradient-to-r from-green-500 to-emerald-500' 
                                : 'w-4 sm:w-5 md:w-6 bg-gray-300 dark:bg-gray-600'
                            }`}
                            animate={idx === currentStep ? {
                              scale: [1, 1.15, 1],
                              boxShadow: [
                                '0 0 0px rgba(59, 130, 246, 0.5)',
                                '0 0 20px rgba(168, 85, 247, 0.8)',
                                '0 0 0px rgba(59, 130, 246, 0.5)',
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
                              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-md opacity-50"
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
                        className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight px-2"
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
                          className="relative w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors shadow-md border border-gray-200 dark:border-gray-600 text-xs sm:text-sm overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-600/0 dark:via-gray-600/50 dark:to-gray-600/0"
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
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                          }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-blue-500/30 dark:shadow-blue-500/20 text-xs sm:text-sm overflow-hidden group"
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
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                          }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-blue-500/30 dark:shadow-blue-500/20 text-xs sm:text-sm overflow-hidden group"
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
                          className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-xs sm:text-sm transition-colors font-medium group"
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
