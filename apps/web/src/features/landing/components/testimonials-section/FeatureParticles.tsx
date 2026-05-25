'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface FeatureParticlesProps {
  color: string
  isVisible: boolean
}

export function FeatureParticles({ color, isVisible }: FeatureParticlesProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {[...Array(8)].map((_, index) => (
            <motion.div
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: `${50 + Math.cos((index * 45 * Math.PI) / 180) * 80}%`,
                y: `${50 + Math.sin((index * 45 * Math.PI) / 180) * 80}%`,
              }}
              className="absolute w-2 h-2 rounded-full"
              exit={{ opacity: 0, scale: 0 }}
              initial={{ x: '50%', y: '50%', opacity: 0, scale: 0 }}
              key={index}
              style={{ backgroundColor: color }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  )
}
