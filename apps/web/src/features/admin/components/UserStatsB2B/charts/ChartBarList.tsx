'use client'

import { motion } from 'framer-motion'
import { SOFLIA_ADMIN_CHART_COLORS } from '../../../constants/admin-color-tokens'
import { UserStatsEmptyState } from '../shared/UserStatsEmptyState'
import { getChartLabel, getChartNumber, type ChartDatum } from './chart-utils'

interface ChartBarListProps {
  data: ChartDatum[]
  dataKey: string
  nameKey: string
  color?: string
}

export function ChartBarList({ data, dataKey, nameKey, color }: ChartBarListProps) {
  const validData = data.filter((item) => item && item[dataKey] != null)
  const maxValue = validData.length > 0 ? Math.max(...validData.map((item) => getChartNumber(item[dataKey]))) : 1

  if (validData.length === 0) return <UserStatsEmptyState />

  return (
    <div className="space-y-3">
      {validData.slice(0, 10).map((item, index) => {
        const value = getChartNumber(item[dataKey])
        const label = getChartLabel(item[nameKey])
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

        return (
          <div key={`${label}-${index}`} className="grid grid-cols-[minmax(0,140px)_1fr_56px] items-center gap-3">
            <span className="truncate text-sm text-slate-500 dark:text-slate-300">{label}</span>
            <div className="h-6 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.04, duration: 0.7 }}
                className="h-full rounded-full"
                style={{ background: color ?? `linear-gradient(90deg, ${SOFLIA_ADMIN_CHART_COLORS[index % SOFLIA_ADMIN_CHART_COLORS.length]}, ${SOFLIA_ADMIN_CHART_COLORS[(index + 1) % SOFLIA_ADMIN_CHART_COLORS.length]})` }}
              />
            </div>
            <span className="text-right text-sm font-semibold text-slate-700 dark:text-white">
              {Number.isInteger(value) ? value : value.toFixed(1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
