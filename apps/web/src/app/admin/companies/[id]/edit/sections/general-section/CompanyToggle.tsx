'use client'

import { motion } from 'framer-motion'

export function CompanyToggle({
  checked,
  label,
  activeColor,
  onToggle,
}: {
  checked: boolean
  label: string
  activeColor: string
  onToggle: () => void
}) {
  return (
    <div className="flex h-[42px] items-center gap-3">
      <button
        onClick={onToggle}
        className="relative h-6 w-12 rounded-full transition-colors"
        style={{ backgroundColor: checked ? activeColor : 'rgba(136, 153, 166, 0.4)' }}
      >
        <motion.div
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
          animate={{ left: checked ? '1.75rem' : '0.25rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      <span className="text-sm text-gray-900 dark:text-white">{label}</span>
    </div>
  )
}
