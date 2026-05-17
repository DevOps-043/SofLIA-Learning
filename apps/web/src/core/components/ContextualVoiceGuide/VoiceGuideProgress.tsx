'use client';

import { motion } from 'framer-motion';

interface VoiceGuideProgressProps {
  currentStep: number;
  disableHeavy: boolean;
  totalSteps: number;
}

export function VoiceGuideProgress({
  currentStep,
  disableHeavy,
  totalSteps,
}: VoiceGuideProgressProps) {
  return (
    <div className="flex gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 md:mb-3 justify-center items-center">
      {Array.from({ length: totalSteps }, (_, idx) => (
        <motion.div key={idx} className="relative" whileHover={{ scale: 1.2 }}>
          <motion.div
            className={`h-1 sm:h-1.5 rounded-full transition-all ${getProgressClassName(idx, currentStep)}`}
            animate={idx === currentStep && !disableHeavy ? {
              scale: [1, 1.15, 1],
              boxShadow: [
                '0 0 0px color-mix(in srgb, var(--color-accent) 50%, transparent)',
                '0 0 20px color-mix(in srgb, var(--color-accent) 80%, transparent)',
                '0 0 0px color-mix(in srgb, var(--color-accent) 50%, transparent)',
              ],
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {idx === currentStep && !disableHeavy ? (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent blur-md opacity-50"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}

function getProgressClassName(index: number, currentStep: number): string {
  if (index === currentStep) {
    return 'w-6 sm:w-8 md:w-10 bg-gradient-to-r from-primary via-accent to-primary shadow-lg shadow-accent/50';
  }

  if (index < currentStep) {
    return 'w-4 sm:w-5 md:w-6 bg-success';
  }

  return 'w-4 sm:w-5 md:w-6 bg-gray-200 dark:bg-gray-500/30';
}
