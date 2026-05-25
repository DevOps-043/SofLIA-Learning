'use client'

import { motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'

export function InviteLinksErrorAlert({ error, onDismiss }: { error: string | null; onDismiss: () => void }) {
  if (!error) return null

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      <span className="text-sm text-red-400 flex-1">{error}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
    </motion.div>
  )
}
