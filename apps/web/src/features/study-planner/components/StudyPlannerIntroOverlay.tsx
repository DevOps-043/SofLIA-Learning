'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';

import { STUDY_PLANNER_STEPS } from '../constants/studyPlannerSteps';
import { StudyPlannerResumeSessionPrompt } from './StudyPlannerResumeSessionPrompt';

interface StudyPlannerIntroOverlayProps {
  isVisible: boolean;
  showResumePrompt: boolean;
  savedSessionDate: string | null;
  currentStep: number;
  isMobile: boolean;
  isSpeaking: boolean;
  isAudioEnabled: boolean;
  isListening: boolean;
  isProcessing: boolean;
  onToggleAudio: () => void;
  onSkip: () => void;
  onDiscardSession: () => void;
  onResumeSession: () => void;
  onToggleListening: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export function StudyPlannerIntroOverlay({
  isVisible,
  showResumePrompt,
  savedSessionDate,
  currentStep,
  isMobile,
  isSpeaking,
  isAudioEnabled,
  isListening,
  isProcessing,
  onToggleAudio,
  onSkip,
  onDiscardSession,
  onResumeSession,
  onToggleListening,
  onPrevious,
  onNext,
  onComplete,
}: StudyPlannerIntroOverlayProps) {
  const step = STUDY_PLANNER_STEPS[currentStep];
  const isLastStep = currentStep === STUDY_PLANNER_STEPS.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998] bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md"
          onClick={onSkip}
        />

        {showResumePrompt && (
          <StudyPlannerResumeSessionPrompt
            savedSessionDate={savedSessionDate}
            onDiscardSession={onDiscardSession}
            onResumeSession={onResumeSession}
          />
        )}

        <div className="fixed inset-0 z-[9999] flex h-[100dvh] items-center justify-center overflow-hidden p-2 pointer-events-none sm:p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.6 }}
            className="relative flex max-h-[95dvh] w-full max-w-4xl flex-col items-center justify-center pointer-events-auto"
          >
            <div className="relative flex flex-shrink-0 flex-col items-center">
              <div className="relative mb-1.5 h-28 w-28 sm:mb-2 sm:h-36 sm:w-36 md:mb-3 md:h-44 md:w-44">
                <motion.div
                  className="absolute inset-8 overflow-hidden rounded-full bg-gradient-to-br from-[#00D4B3] via-[#00D4B3] to-[#00b89a] p-1 sm:inset-10 md:inset-12"
                  animate={
                    isSpeaking && !isMobile
                      ? { scale: [1, 1.08, 1] }
                      : {}
                  }
                  style={{
                    boxShadow: isSpeaking
                      ? '0 0 50px rgba(168, 85, 247, 0.7)'
                      : '0 0 50px rgba(139, 92, 246, 0.7)',
                  }}
                  transition={{
                    scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
                  }}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm">
                    <Image src="/lia-avatar.png" alt="SofLIA" fill sizes="256px" className="object-cover" priority />
                  </div>
                </motion.div>

                {/* Floating particles — desktop only to avoid GPU overload on mobile */}
                {!isMobile && [...Array(8)].map((_, index) => {
                  const radius = 70;
                  return (
                    <motion.div
                      key={index}
                      className="absolute h-1 w-1 rounded-full bg-white sm:h-1.5 sm:w-1.5"
                      style={{ left: '50%', top: '50%' }}
                      animate={{
                        x: [0, Math.cos((index * 45 * Math.PI) / 180) * radius],
                        y: [0, Math.sin((index * 45 * Math.PI) / 180) * radius],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: index * 0.2, ease: 'easeOut' }}
                    />
                  );
                })}

                {isSpeaking && (
                  <motion.div
                    className="absolute inset-6 rounded-full border-2 border-white/50 sm:inset-8"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>

              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.5 }}
                className="relative flex min-h-0 w-full flex-shrink overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-white/95 via-white/90 to-white/95 p-2.5 shadow-2xl backdrop-blur-2xl dark:border-gray-700/50 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 sm:rounded-2xl sm:p-3 md:p-4"
              >
                {/* Static gradient overlay — animated version only on desktop */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
                  }}
                />

                <div className="relative z-10 w-full">
                  <div className="absolute right-1.5 top-1.5 flex gap-1 sm:right-2 sm:top-2 sm:gap-1.5">
                    <motion.button
                      onClick={onToggleAudio}
                      whileHover={{
                        scale: 1.15,
                        rotate: [0, -10, 10, -10, 0],
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      }}
                      whileTap={{ scale: 0.85 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 17,
                        rotate: { duration: 0.5 },
                      }}
                      className="group relative overflow-hidden rounded-full border border-gray-200/50 bg-white/80 p-1.5 text-gray-600 shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-blue-600 dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:hover:text-blue-400 sm:p-2"
                    >
                      <motion.span
                        className="relative z-10"
                        animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {isAudioEnabled ? <Volume2 size={14} className="sm:h-4 sm:w-4" /> : <VolumeX size={14} className="sm:h-4 sm:w-4" />}
                      </motion.span>
                    </motion.button>
                    <motion.button
                      onClick={onSkip}
                      whileHover={{ scale: 1.15, rotate: 90, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                      whileTap={{ scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17, rotate: { duration: 0.3 } }}
                      className="group relative overflow-hidden rounded-full border border-gray-200/50 bg-white/80 p-1.5 text-gray-600 shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-red-600 dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:hover:text-red-400 sm:p-2"
                    >
                      <span className="relative z-10">
                        <X size={14} className="sm:h-4 sm:w-4" />
                      </span>
                    </motion.button>
                  </div>

                  <div className="mb-1.5 flex items-center justify-center gap-1 sm:mb-2 sm:gap-1.5 md:mb-3">
                    {STUDY_PLANNER_STEPS.map((_, index) => (
                      <div key={index} className="relative">
                        {/* Step indicator — CSS animate-pulse instead of JS box-shadow loop */}
                        <div
                          className={`h-1 rounded-full transition-all sm:h-1.5 ${
                            index === currentStep
                              ? 'w-6 bg-gradient-to-r from-[#00D4B3] via-[#00D4B3] to-[#00b89a] shadow-lg shadow-[#00D4B3]/50 sm:w-8 md:w-10 animate-pulse'
                              : index < currentStep
                                ? 'w-4 bg-gradient-to-r from-green-500 to-emerald-500 sm:w-5 md:w-6'
                                : 'w-4 bg-gray-300 dark:bg-gray-600 sm:w-5 md:w-6'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-center sm:space-y-2">
                    <motion.h2
                      key={`title-${currentStep}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="bg-gradient-to-r from-[#0A2540] via-[#0A2540] to-[#00D4B3] bg-clip-text px-2 text-lg font-bold leading-tight text-transparent dark:from-[#0A2540] dark:via-[#0A2540] dark:to-[#00D4B3] sm:text-xl md:text-2xl"
                    >
                      {step.title}
                    </motion.h2>

                    <motion.p
                      key={`description-${currentStep}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="mx-auto max-w-2xl px-2 text-xs font-light leading-relaxed text-gray-700 dark:text-gray-300 sm:text-sm md:text-base"
                    >
                      {step.description}
                    </motion.p>

                    {currentStep === 3 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="mt-2 space-y-2 sm:mt-3 sm:space-y-3"
                      >
                        <div className="flex justify-center">
                          <motion.div
                            className="relative"
                            animate={isListening ? { scale: [1, 1.05] } : {}}
                            transition={{
                              type: 'tween',
                              duration: 2,
                              repeat: Infinity,
                              repeatType: 'reverse',
                              ease: 'easeInOut',
                            }}
                          >
                            {isListening && (
                              <>
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-green-400/50"
                                  animate={{ scale: [1, 1.4, 1.4], opacity: [0.8, 0, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                                />
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                                  animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                                />
                              </>
                            )}

                            <motion.button
                              onClick={onToggleListening}
                              disabled={isProcessing}
                              className={`relative overflow-hidden rounded-full p-5 shadow-2xl transition-all sm:p-6 md:p-7 ${
                                isListening
                                  ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'
                                  : isProcessing
                                    ? 'cursor-not-allowed bg-gradient-to-r from-gray-500 to-gray-600'
                                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600'
                              }`}
                              whileHover={
                                isProcessing
                                  ? {}
                                  : {
                                      scale: 1.12,
                                      boxShadow: '0 10px 40px rgba(59, 130, 246, 0.5)',
                                    }
                              }
                              whileTap={isProcessing ? {} : { scale: 0.88 }}
                              animate={
                                isListening
                                  ? {
                                      boxShadow: ['0 0 25px rgba(34, 197, 94, 0.7)', '0 0 70px rgba(34, 197, 94, 1)'],
                                      scale: [1, 1.05],
                                    }
                                  : isProcessing
                                    ? {
                                        boxShadow: ['0 0 20px rgba(107, 114, 128, 0.5)', '0 0 35px rgba(107, 114, 128, 0.7)'],
                                      }
                                    : {}
                              }
                              transition={{
                                boxShadow: {
                                  type: 'tween',
                                  duration: 1.5,
                                  repeat: Infinity,
                                  repeatType: 'reverse',
                                  ease: 'easeInOut',
                                },
                                scale: {
                                  type: 'tween',
                                  duration: 1.5,
                                  repeat: Infinity,
                                  repeatType: 'reverse',
                                  ease: 'easeInOut',
                                },
                              }}
                            >
                              {isProcessing ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                  <Mic size={24} className="text-white sm:h-7 sm:w-7 md:h-8 md:w-8" />
                                </motion.div>
                              ) : isListening ? (
                                <MicOff size={24} className="text-white sm:h-7 sm:w-7 md:h-8 md:w-8" />
                              ) : (
                                <Mic size={24} className="text-white sm:h-7 sm:w-7 md:h-8 md:w-8" />
                              )}
                            </motion.button>
                          </motion.div>
                        </div>

                        <motion.p
                          key={isListening ? 'listening' : isProcessing ? 'processing' : 'idle'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs font-medium text-gray-800 dark:text-gray-200 sm:text-sm md:text-base"
                        >
                          {isProcessing
                            ? 'Procesando tu pregunta...'
                            : isListening
                              ? 'Escuchando... Habla ahora'
                              : 'Haz clic en el microfono para hablar con SofLIA'}
                        </motion.p>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col items-center justify-center gap-2 sm:mt-3 sm:flex-row md:mt-4">
                    {currentStep > 0 && (
                      <motion.button
                        onClick={onPrevious}
                        whileHover={{ scale: 1.08, x: -4, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 shadow-md transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:w-auto sm:px-5 sm:text-sm"
                      >
                        <span className="relative z-10">Anterior</span>
                      </motion.button>
                    )}

                    {!isLastStep ? (
                      <motion.button
                        onClick={onNext}
                        whileHover={{ scale: 1.08, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)' }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow-xl shadow-blue-500/30 sm:w-auto sm:px-6 sm:text-sm dark:shadow-blue-500/20"
                      >
                        <span className="relative z-10">Siguiente</span>
                        <motion.span
                          className="relative z-10"
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          <ChevronRight size={16} className="sm:h-4 sm:w-4" />
                        </motion.span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={onComplete}
                        whileHover={{ scale: 1.1, boxShadow: '0 10px 30px rgba(34, 197, 94, 0.5)' }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-2 text-sm font-bold text-white shadow-xl shadow-green-500/30 sm:w-auto sm:px-8 sm:py-2.5 sm:text-base dark:shadow-green-500/20"
                      >
                        <span className="relative z-10">Comenzar</span>
                      </motion.button>
                    )}
                  </div>

                  {!isLastStep && (
                    <motion.div
                      className="mt-2 text-center sm:mt-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.button
                        onClick={onSkip}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="group relative text-xs font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 sm:text-sm"
                      >
                        <span className="relative z-10">Saltar introduccion</span>
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
