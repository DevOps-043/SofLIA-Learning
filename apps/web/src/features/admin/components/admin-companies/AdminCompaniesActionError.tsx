'use client'

import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export function AdminCompaniesActionError({ message }: { message: string }) {
  const theme = useAdminPanelTheme()
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 rounded-xl border p-4" style={{ backgroundColor: `color-mix(in srgb, ${theme.warningColor} 6.3%, transparent)`, borderColor: `color-mix(in srgb, ${theme.warningColor} 18.8%, transparent)` }}>
      <AlertTriangle className="h-5 w-5" style={{ color: theme.warningColor }} />
      <p className="text-sm" style={{ color: theme.warningColor }}>{message}</p>
    </motion.div>
  )
}
