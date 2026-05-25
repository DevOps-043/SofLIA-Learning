'use client'

import { motion } from 'framer-motion'
import { SOFLIA_ADMIN_CHART_COLORS } from '../../../constants/admin-color-tokens'
import { UserStatsEmptyState } from '../shared/UserStatsEmptyState'
import { getChartLabel, getChartNumber, type ChartDatum } from './chart-utils'

interface ChartPieLegendProps {
  data: ChartDatum[]
  dataKey: string
  nameKey: string
}

export function ChartPieLegend({ data, dataKey, nameKey }: ChartPieLegendProps) {
  const validData = data.filter((item) => item && getChartNumber(item[dataKey]) > 0)
  const total = validData.reduce((sum, item) => sum + getChartNumber(item[dataKey]), 0)

  if (!validData.length || total === 0) return <UserStatsEmptyState />

  return (
    <div className="space-y-3">
      {validData.map((item, index) => {
        const value = getChartNumber(item[dataKey])
        const percentage = (value / total) * 100

        return (
          <motion.div
            key={`${getChartLabel(item[nameKey])}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: SOFLIA_ADMIN_CHART_COLORS[index % SOFLIA_ADMIN_CHART_COLORS.length] }} />
                <span className="text-sm text-slate-600 dark:text-slate-200">{getChartLabel(item[nameKey])}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
            </div>
            <div className="mb-2 h-2 rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: SOFLIA_ADMIN_CHART_COLORS[index % SOFLIA_ADMIN_CHART_COLORS.length] }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{percentage.toFixed(1)}%</p>
          </motion.div>
        )
      })}
    </div>
  )
}
