'use client'

import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { STUDY_PLANNER_STEPS } from '../constants/studyPlannerSteps'
import { StudyPlannerIntroStepNavigation } from './StudyPlannerIntroStepNavigation'

interface StudyPlannerIntroStepContentProps {
  currentStep: number
  isListening: boolean
  isProcessing: boolean
  onComplete: () => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onToggleListening: () => void
}

export function StudyPlannerIntroStepContent({
  currentStep,
  isListening,
  isProcessing,
  onComplete,
  onNext,
  onPrevious,
  onSkip,
  onToggleListening,
}: StudyPlannerIntroStepContentProps) {
  const step = STUDY_PLANNER_STEPS[currentStep]
  const isLastStep = currentStep === STUDY_PLANNER_STEPS.length - 1

  return (
    <>
      <div className="mb-1.5 flex items-center justify-center gap-1 sm:mb-2 sm:gap-1.5 md:mb-3">
        {STUDY_PLANNER_STEPS.map((_, index) => (
          <div key={index} className="relative">
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

      <StudyPlannerIntroStepNavigation
        currentStep={currentStep}
        isLastStep={isLastStep}
        onComplete={onComplete}
        onNext={onNext}
        onPrevious={onPrevious}
        onSkip={onSkip}
      />
    </>
  )
}
