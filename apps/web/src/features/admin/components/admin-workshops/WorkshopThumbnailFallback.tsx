'use client'

import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { useMotionSafe } from '@/lib/utils/motion'

export function WorkshopThumbnailFallback() {
  const { disableHeavy } = useMotionSafe()
  const theme = useAdminPanelTheme()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center" style={{ background: theme.heroBackground }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.accentColor} 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
      <motion.div animate={disableHeavy ? {} : { scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative z-10">
        <div className="rounded-2xl border p-6 backdrop-blur-sm" style={{ backgroundColor: theme.inverseSurface, borderColor: theme.inverseBorderColor }}>
          <BookOpen className="h-24 w-24" style={{ color: theme.accentColor }} />
        </div>
      </motion.div>
    </motion.div>
  )
}
