'use client';

import { motion } from 'framer-motion';
import { VoiceGuideStep } from './types';
import {
  CompleteGuideButton,
  PrimaryGuideButton,
  SecondaryGuideButton,
} from './VoiceGuideButtons';

interface VoiceGuideNavigationProps {
  currentStep: number;
  disableHeavy: boolean;
  step: VoiceGuideStep;
  totalSteps: number;
  t: (key: string) => string;
  onActionClick: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export function VoiceGuideNavigation({
  currentStep,
  disableHeavy,
  step,
  totalSteps,
  t,
  onActionClick,
  onComplete,
  onNext,
  onPrevious,
  onSkip,
}: VoiceGuideNavigationProps) {
  const isLastStep = currentStep >= totalSteps - 1;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-2 sm:mt-3 md:mt-4">
        {currentStep > 0 ? (
          <SecondaryGuideButton onClick={onPrevious}>
            {t('onboarding.buttons.previous')}
          </SecondaryGuideButton>
        ) : null}
        {step.action && !isLastStep ? (
          <PrimaryGuideButton onClick={onActionClick}>
            {step.action.label}
          </PrimaryGuideButton>
        ) : null}
        {!isLastStep ? (
          <PrimaryGuideButton onClick={onNext}>
            {t('onboarding.buttons.next')}
          </PrimaryGuideButton>
        ) : (
          <CompleteGuideButton disableHeavy={disableHeavy} onClick={onComplete}>
            {t('onboarding.buttons.start')}
          </CompleteGuideButton>
        )}
      </div>
      {!isLastStep ? (
        <motion.div className="text-center mt-2 sm:mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <motion.button
            onClick={onSkip}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs sm:text-sm transition-colors font-medium group"
            type="button"
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
      ) : null}
    </>
  );
}
