'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface SidebarOverlayProps {
  isOpen: boolean
  onClose: () => void
  overlayBg: string
}

export function SidebarOverlay({ isOpen, onClose, overlayBg }: SidebarOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
    </AnimatePresence>
  )
}
