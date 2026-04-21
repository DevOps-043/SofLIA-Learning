'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { StudyPlannerIntroAvatar } from './StudyPlannerIntroAvatar'
import { StudyPlannerIntroOverlayControls } from './StudyPlannerIntroOverlayControls'
import { StudyPlannerIntroStepContent } from './StudyPlannerIntroStepContent'
import { StudyPlannerResumeSessionPrompt } from './StudyPlannerResumeSessionPrompt'
import type { StudyPlannerIntroOverlayProps } from './StudyPlannerIntroOverlay.types'

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
                <StudyPlannerIntroAvatar isMobile={isMobile} isSpeaking={isSpeaking} />

                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.5 }}
                  className="relative flex min-h-0 w-full flex-shrink overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-white/95 via-white/90 to-white/95 p-2.5 shadow-2xl backdrop-blur-2xl dark:border-gray-700/50 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 sm:rounded-2xl sm:p-3 md:p-4"
                >
                  <div
                    className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
                    }}
                  />

                  <div className="relative z-10 w-full">
                    <StudyPlannerIntroOverlayControls
                      isAudioEnabled={isAudioEnabled}
                      isSpeaking={isSpeaking}
                      onSkip={onSkip}
                      onToggleAudio={onToggleAudio}
                    />
                    <StudyPlannerIntroStepContent
                      currentStep={currentStep}
                      isListening={isListening}
                      isProcessing={isProcessing}
                      onComplete={onComplete}
                      onNext={onNext}
                      onPrevious={onPrevious}
                      onSkip={onSkip}
                      onToggleListening={onToggleListening}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
