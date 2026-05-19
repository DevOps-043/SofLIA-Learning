'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BrandingFeedbackMessagesProps {
  saveSuccess: string | null
  saveError: string | null
}

export function BrandingFeedbackMessages({
  saveSuccess,
  saveError,
}: BrandingFeedbackMessagesProps) {
  const theme = useBusinessPanelTheme()

  return (
    <div className="space-y-4">
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: `color-mix(in srgb, ${theme.successColor} 7.8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${theme.successColor} 20%, transparent)`,
          }}
        >
          <CheckCircle
            className="w-5 h-5 flex-shrink-0"
            style={{ color: theme.successColor }}
          />
          <p className="text-sm font-medium" style={{ color: theme.successColor }}>
            {saveSuccess}
          </p>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${theme.dangerColor} 20%, transparent)`,
          }}
        >
          <AlertCircle
            className="w-5 h-5 flex-shrink-0"
            style={{ color: theme.dangerColor }}
          />
          <p className="text-sm font-medium" style={{ color: theme.dangerColor }}>
            {saveError}
          </p>
        </motion.div>
      )}
    </div>
  )
}
