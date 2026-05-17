'use client'

import { motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import type { BusinessPanelTheme, DeadlineT } from './types'

interface DeadlineModalHeaderProps {
  courseTitle: string
  theme: BusinessPanelTheme
  t: DeadlineT
  onClose: () => void
}

export function DeadlineModalHeader({
  courseTitle,
  theme,
  t,
  onClose,
}: DeadlineModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b p-6" style={{ borderColor: theme.borderColor }}>
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${theme.primaryColor}20` }}
        >
          <Sparkles className="h-5 w-5" style={{ color: theme.primaryColor }} />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: theme.textColor }}>
            {t('liaSuggestion.title')}
          </h2>
          <p className="text-sm" style={{ color: theme.subtextColor }}>
            {courseTitle}
          </p>
        </div>
      </div>
      <motion.button
        type="button"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
        onMouseEnter={event => { event.currentTarget.style.backgroundColor = theme.hoverBg }}
        onMouseLeave={event => { event.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <X className="h-5 w-5" style={{ color: theme.subtextColor }} />
      </motion.button>
    </div>
  )
}
