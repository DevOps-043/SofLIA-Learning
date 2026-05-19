'use client'

import type { CSSProperties } from 'react'
import { motion, type MotionValue } from 'framer-motion'

interface TestimonialsBackgroundProps {
  disableHeavy: boolean
  opacity: MotionValue<number>
  y1: MotionValue<number>
  y2: MotionValue<number>
}

export function TestimonialsBackground({
  disableHeavy,
  opacity,
  y1,
  y2,
}: TestimonialsBackgroundProps) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity: opacity as CSSProperties['opacity'] }}
    >
      <motion.div
        animate={disableHeavy ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        className="absolute -top-[200px] -left-[200px] w-[700px] h-[700px] bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl"
        style={{ y: y1 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        animate={disableHeavy ? {} : { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        className="absolute -bottom-[200px] -right-[200px] w-[700px] h-[700px] bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl"
        style={{ y: y2 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
    </motion.div>
  )
}
