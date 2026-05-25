'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface StudyPlannerIntroAvatarProps {
  isMobile: boolean
  isSpeaking: boolean
}

export function StudyPlannerIntroAvatar({
  isMobile,
  isSpeaking,
}: StudyPlannerIntroAvatarProps) {
  return (
    <div className="relative mb-1.5 h-28 w-28 sm:mb-2 sm:h-36 sm:w-36 md:mb-3 md:h-44 md:w-44">
      <motion.div
        className="absolute inset-8 overflow-hidden rounded-full bg-gradient-to-br from-accent via-accent to-accent p-1 sm:inset-10 md:inset-12"
        animate={isSpeaking && !isMobile ? { scale: [1, 1.08, 1] } : {}}
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
          <Image src="/lia-avatar.webp" alt="SofLIA" fill sizes="256px" className="object-cover" priority />
        </div>
      </motion.div>

      {!isMobile &&
        [...Array(8)].map((_, index) => {
          const radius = 70
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
          )
        })}

      {isSpeaking && (
        <motion.div
          className="absolute inset-6 rounded-full border-2 border-white/50 sm:inset-8"
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}
