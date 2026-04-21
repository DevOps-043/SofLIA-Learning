'use client'

import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import type { StudyPlanConfig } from '../types/user-context.types'

interface PlanSummaryScheduleCardProps {
  config: StudyPlanConfig
  preferredDaysFormatted: string
}

export function PlanSummaryScheduleCard({
  config,
  preferredDaysFormatted,
}: PlanSummaryScheduleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
          <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white">Dias y Horarios</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Dias preferidos:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {preferredDaysFormatted}
          </span>
        </div>
        {config.preferredTimeBlocks.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Horarios:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {config.preferredTimeBlocks.map((block, index) => (
                <span key={index}>
                  {block.startHour}:{String(block.startMinute).padStart(2, '0')} -{' '}
                  {block.endHour}:{String(block.endMinute).padStart(2, '0')}
                  {index < config.preferredTimeBlocks.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
