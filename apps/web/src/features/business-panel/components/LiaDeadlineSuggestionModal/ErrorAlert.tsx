'use client'

import { motion } from 'framer-motion'
import type { BusinessPanelTheme } from './types'

interface ErrorAlertProps {
  error: string
  theme: BusinessPanelTheme
}

export function ErrorAlert({ error, theme }: ErrorAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4 rounded-xl border p-4 text-sm"
      style={{
        backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 6.3%, transparent)`,
        borderColor: `color-mix(in srgb, ${theme.dangerColor} 18.8%, transparent)`,
        color: theme.dangerColor,
      }}
    >
      {error}
    </motion.div>
  )
}
