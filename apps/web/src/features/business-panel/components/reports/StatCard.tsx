'use client'

import { motion } from 'framer-motion'
import type { ElementType } from 'react'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: ElementType; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-5 rounded-2xl border backdrop-blur-sm bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </motion.div>
  )
}


export { StatCard }
