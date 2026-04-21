'use client'

import { motion } from 'framer-motion'
import { Volume2, VolumeX, X } from 'lucide-react'

interface StudyPlannerIntroOverlayControlsProps {
  isAudioEnabled: boolean
  isSpeaking: boolean
  onSkip: () => void
  onToggleAudio: () => void
}

export function StudyPlannerIntroOverlayControls({
  isAudioEnabled,
  isSpeaking,
  onSkip,
  onToggleAudio,
}: StudyPlannerIntroOverlayControlsProps) {
  return (
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
          {isAudioEnabled ? (
            <Volume2 size={14} className="sm:h-4 sm:w-4" />
          ) : (
            <VolumeX size={14} className="sm:h-4 sm:w-4" />
          )}
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
  )
}
