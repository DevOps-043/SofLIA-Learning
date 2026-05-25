'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface VoiceGuidePanelProps {
  children: ReactNode;
  currentStep: number;
  disableHeavy: boolean;
}

export function VoiceGuidePanel({
  children,
  currentStep,
  disableHeavy,
}: VoiceGuidePanelProps) {
  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.5 }}
      className="relative bg-gradient-to-br from-white/95 via-white/90 to-white/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-2.5 sm:p-3 md:p-4 w-full overflow-hidden flex-shrink min-h-0"
    >
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-30 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10"
        animate={disableHeavy ? {} : { backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
      />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
