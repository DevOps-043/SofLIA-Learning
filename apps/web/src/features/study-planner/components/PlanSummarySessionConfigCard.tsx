'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import type { StudyPlanConfig } from '../types/user-context.types'

interface PlanSummarySessionConfigCardProps {
  config: StudyPlanConfig
  totalSessions: number
}

export function PlanSummarySessionConfigCard({
  config,
  totalSessions,
}: PlanSummarySessionConfigCardProps) {
  const items = [
    { label: 'Min. sesion', value: config.minSessionMinutes },
    { label: 'Max. sesion', value: config.maxSessionMinutes },
    { label: 'Descanso', value: config.breakDurationMinutes },
    { label: 'Sesiones', value: totalSessions },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white">
          Configuracion de Sesiones
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
