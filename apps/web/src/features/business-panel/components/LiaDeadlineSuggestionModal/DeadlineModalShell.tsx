'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { BusinessPanelTheme } from './types'

interface DeadlineModalShellProps {
  children: ReactNode
  theme: BusinessPanelTheme
  onClose: () => void
}

export function DeadlineModalShell({ children, theme, onClose }: DeadlineModalShellProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex h-app-dynamic items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: theme.overlayBg }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
