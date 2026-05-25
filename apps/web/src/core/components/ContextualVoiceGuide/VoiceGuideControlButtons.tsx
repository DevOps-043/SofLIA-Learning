'use client';

import { motion } from 'framer-motion';
import { Volume2, VolumeX, X } from 'lucide-react';
import { ReactNode } from 'react';

interface VoiceGuideControlButtonsProps {
  isAudioEnabled: boolean;
  isSpeaking: boolean;
  onSkip: () => void;
  onToggleAudio: () => void;
}

export function VoiceGuideControlButtons({
  isAudioEnabled,
  isSpeaking,
  onSkip,
  onToggleAudio,
}: VoiceGuideControlButtonsProps) {
  return (
    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1 sm:gap-1.5">
      <ControlButton
        hoverShadow="0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)"
        onClick={onToggleAudio}
      >
        <motion.span
          className="relative z-10"
          animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isAudioEnabled ? <Volume2 size={14} className="sm:w-4 sm:h-4" /> : <VolumeX size={14} className="sm:w-4 sm:h-4" />}
        </motion.span>
      </ControlButton>
      <ControlButton
        hoverClassName="hover:text-red-600 dark:hover:text-red-400"
        hoverShadow="0 4px 12px rgba(239, 68, 68, 0.3)"
        onClick={onSkip}
        rotateOnHover={90}
      >
        <span className="relative z-10">
          <X size={14} className="sm:w-4 sm:h-4" />
        </span>
      </ControlButton>
    </div>
  );
}

function ControlButton({
  children,
  hoverClassName = 'hover:text-accent dark:hover:text-accent',
  hoverShadow,
  onClick,
  rotateOnHover,
}: {
  children: ReactNode;
  hoverClassName?: string;
  hoverShadow: string;
  onClick: () => void;
  rotateOnHover?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15, rotate: rotateOnHover ?? [0, -10, 10, -10, 0], boxShadow: hoverShadow }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17, rotate: { duration: 0.5 } }}
      className={`relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-carbon-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/30 hover:bg-white dark:hover:bg-primary/30 transition-colors text-gray-500 dark:text-white/60 shadow-lg overflow-hidden group ${hoverClassName}`}
      type="button"
    >
      <motion.div className="absolute inset-0 bg-accent/10 rounded-full" initial={{ scale: 0, opacity: 0 }} whileHover={{ scale: 1.5, opacity: 1 }} transition={{ duration: 0.3 }} />
      {children}
    </motion.button>
  );
}
