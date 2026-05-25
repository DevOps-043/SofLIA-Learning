'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import type { BusinessPanelTheme, SidebarTranslator } from './types'

interface SidebarPinFeedbackProps {
  isPinned: boolean
  show: boolean
  t: SidebarTranslator
  theme: BusinessPanelTheme
}

export function SidebarPinFeedback({ isPinned, show, t, theme }: SidebarPinFeedbackProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 py-1 border-b overflow-hidden"
          style={{ backgroundColor: theme.hoverBg, borderColor: theme.borderColor }}
        >
          <p className="text-[10px] font-medium flex items-center gap-1.5 justify-center py-1" style={{ color: theme.accentColor }}>
            <MapPin className="w-3 h-3" />
            {isPinned ? t('sidebar.pinned') : t('sidebar.unpinned')}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
