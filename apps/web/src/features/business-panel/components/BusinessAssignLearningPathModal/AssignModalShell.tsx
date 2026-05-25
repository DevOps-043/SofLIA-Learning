import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { BusinessPanelTheme } from './types'

export function AssignModalShell({
  children,
  onClose,
  theme,
}: {
  children: ReactNode
  onClose: () => void
  theme: BusinessPanelTheme
}) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: theme.overlayBg }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
