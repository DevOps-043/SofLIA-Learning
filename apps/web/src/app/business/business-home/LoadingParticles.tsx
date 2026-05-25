import { motion } from 'framer-motion'
import type { LoadingParticle } from './types'

export function BusinessLoadingParticles({ particles }: { particles: LoadingParticle[] }) {
  return (
    <>
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: 'var(--color-primary, rgb(59, 130, 246))',
            opacity: 0.3,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.xOffset, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}
    </>
  )
}
