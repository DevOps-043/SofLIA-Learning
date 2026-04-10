'use client'

import { motion } from 'framer-motion'
import { XCircle } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BrandingErrorStateProps {
  error: string
}

export function BrandingErrorState({ error }: BrandingErrorStateProps) {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <XCircle
          className="w-20 h-20 mx-auto mb-6"
          style={{ color: theme.dangerColor }}
        />
      </motion.div>
      <p className="text-lg mb-4" style={{ color: theme.dangerColor }}>
        {error}
      </p>
    </motion.div>
  )
}
