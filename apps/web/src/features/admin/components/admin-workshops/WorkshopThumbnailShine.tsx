'use client'

import { motion } from 'framer-motion'
import { useMotionSafe } from '@/lib/utils/motion'

export function WorkshopThumbnailShine() {
  const { disableHeavy } = useMotionSafe()
  if (disableHeavy) return null
  return (
    <motion.div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)' }} animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }} />
  )
}
