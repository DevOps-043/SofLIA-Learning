'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface BrandingFeedbackMessagesProps {
  saveSuccess: string | null
  saveError: string | null
}

export function BrandingFeedbackMessages({
  saveSuccess,
  saveError,
}: BrandingFeedbackMessagesProps) {
  return (
    <div className="space-y-4">
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm font-medium">{saveSuccess}</p>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background:
              'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm font-medium">{saveError}</p>
        </motion.div>
      )}
    </div>
  )
}
