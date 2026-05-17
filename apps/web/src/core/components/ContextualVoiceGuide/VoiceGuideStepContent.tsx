'use client';

import { motion } from 'framer-motion';
import { VoiceGuideStep } from './types';

interface VoiceGuideStepContentProps {
  currentStep: number;
  step: VoiceGuideStep;
}

export function VoiceGuideStepContent({
  currentStep,
  step,
}: VoiceGuideStepContentProps) {
  return (
    <div className="text-center space-y-1.5 sm:space-y-2">
      <motion.h2
        key={`title-${currentStep}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary dark:from-accent dark:via-accent dark:to-accent bg-clip-text text-transparent leading-tight px-2"
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
  );
}
