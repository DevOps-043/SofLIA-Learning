'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SocialLoginToggleProps {
  description: string
  enabled: boolean
  icon: ReactNode
  isUpdating: boolean
  name: string
  onToggle: () => void | Promise<void>
}

export function SocialLoginToggle({
  description,
  enabled,
  icon,
  isUpdating,
  name,
  onToggle,
}: SocialLoginToggleProps) {
  return (
    <motion.div className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/5 bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10" whileHover={{ x: 2 }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5 shadow-lg border border-gray-100 dark:border-transparent">{icon}</div>
        <div><p className="text-base font-semibold text-gray-900 dark:text-white">{name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{description}</p></div>
      </div>
      <motion.button type="button" onClick={() => void onToggle()} disabled={isUpdating} whileTap={{ scale: 0.95 }} className="relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner" style={{ background: enabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(156, 163, 175, 0.3)' }}>
        <motion.span animate={{ x: enabled ? 34 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="inline-block h-6 w-6 rounded-full bg-white shadow-lg" />
      </motion.button>
    </motion.div>
  )
}
