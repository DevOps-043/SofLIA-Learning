'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMotionSafe } from '../../../lib/utils/motion';
import { VoiceGuideAvatar } from './VoiceGuideAvatar';
import { VoiceGuideControlButtons } from './VoiceGuideControlButtons';
import { VoiceGuideNavigation } from './VoiceGuideNavigation';
import { VoiceGuidePanel } from './VoiceGuidePanel';
import { VoiceGuideProgress } from './VoiceGuideProgress';
import { VoiceGuideStepContent } from './VoiceGuideStepContent';
import { useContextualVoiceGuideLogic } from './hooks/useContextualVoiceGuideLogic';
import { ContextualVoiceGuideProps } from './types';

export function ContextualVoiceGuide(props: ContextualVoiceGuideProps) {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();
  const guide = useContextualVoiceGuideLogic(props);

  return (
    <AnimatePresence>
      {guide.isVisible ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md z-[9998]"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.6 }}
              className="relative max-w-4xl w-full pointer-events-auto max-h-[95vh] flex flex-col items-center justify-center"
            >
              <div className="relative flex flex-col items-center flex-shrink-0">
                <VoiceGuideAvatar
                  disableHeavy={disableHeavy}
                  isMobile={guide.isMobile}
                  isSpeaking={guide.isSpeaking}
                />
                <VoiceGuidePanel currentStep={guide.currentStep} disableHeavy={disableHeavy}>
                  <VoiceGuideControlButtons
                    isAudioEnabled={guide.isAudioEnabled}
                    isSpeaking={guide.isSpeaking}
                    onSkip={guide.handleSkip}
                    onToggleAudio={guide.toggleAudio}
                  />
                  <VoiceGuideProgress
                    currentStep={guide.currentStep}
                    disableHeavy={disableHeavy}
                    totalSteps={guide.ONBOARDING_STEPS.length}
                  />
                  <VoiceGuideStepContent currentStep={guide.currentStep} step={guide.step} />
                  <VoiceGuideNavigation
                    currentStep={guide.currentStep}
                    disableHeavy={disableHeavy}
                    step={guide.step}
                    totalSteps={guide.ONBOARDING_STEPS.length}
                    t={t}
                    onActionClick={guide.handleActionClick}
                    onComplete={guide.handleComplete}
                    onNext={guide.handleNext}
                    onPrevious={guide.handlePrevious}
                    onSkip={guide.handleSkip}
                  />
                </VoiceGuidePanel>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
