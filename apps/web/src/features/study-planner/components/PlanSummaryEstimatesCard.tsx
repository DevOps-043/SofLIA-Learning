'use client'

import { motion } from 'framer-motion'
import type { PlanSummaryStats } from './PlanSummary.types'

interface PlanSummaryEstimatesCardProps {
  stats: PlanSummaryStats
}

export function PlanSummaryEstimatesCard({
  stats,
}: PlanSummaryEstimatesCardProps) {
  const items = [
    { label: 'Tiempo total', value: `${stats.totalHours}h` },
    { label: 'Sesiones', value: stats.totalSessions },
    { label: 'Semanas', value: stats.estimatedWeeks },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30"
    >
      <h3 className="font-medium text-gray-900 dark:text-white mb-4">Estimaciones</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {item.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
