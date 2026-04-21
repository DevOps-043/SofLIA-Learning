'use client'

import { motion } from 'framer-motion'
import { Building2, Target, User } from 'lucide-react'
import type { StudyPlanConfig } from '../types/user-context.types'

interface PlanSummaryOverviewGridProps {
  config: StudyPlanConfig
}

export function PlanSummaryOverviewGrid({
  config,
}: PlanSummaryOverviewGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            {config.userType === 'b2b' ? (
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Tipo de Plan</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {config.userType === 'b2b' ? 'Empresarial (B2B)' : 'Personal (B2C)'}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Meta Semanal</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {config.goalHoursPerWeek} horas por semana
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
