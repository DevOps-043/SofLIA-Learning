'use client'

import { motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BulkInviteErrorProps {
  error: string | null
  onDismiss: () => void
}

export function BulkInviteError({ error, onDismiss }: BulkInviteErrorProps) {
  const theme = useBusinessPanelTheme()

  if (!error) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border flex items-center gap-3"
      style={{ backgroundColor: `${theme.dangerColor}10`, borderColor: `${theme.dangerColor}20` }}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: theme.dangerColor }} />
      <span className="text-sm flex-1" style={{ color: theme.dangerColor }}>{error}</span>
      <button type="button" onClick={onDismiss}>
        <X className="w-4 h-4" style={{ color: theme.dangerColor }} />
      </button>
    </motion.div>
  )
}
