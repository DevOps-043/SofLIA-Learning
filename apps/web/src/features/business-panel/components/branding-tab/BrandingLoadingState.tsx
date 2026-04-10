'use client'

import { motion } from 'framer-motion'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export function BrandingLoadingState() {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 rounded-full mb-6 border-4"
        style={{
          borderColor: theme.actionSurface,
          borderTopColor: theme.actionColor,
        }}
      />
      <p style={{ color: theme.subtextColor }}>
        Cargando configuración de marca...
      </p>
    </motion.div>
  )
}
