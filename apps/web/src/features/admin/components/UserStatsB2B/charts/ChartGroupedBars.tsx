'use client'

import { motion } from 'framer-motion'
import { UserStatsEmptyState } from '../shared/UserStatsEmptyState'
import { getChartLabel, getChartNumber, type ChartDatum, type GroupedBarKey } from './chart-utils'

interface ChartGroupedBarsProps {
  data: ChartDatum[]
  keys: GroupedBarKey[]
  nameKey: string
}

export function ChartGroupedBars({ data, keys, nameKey }: ChartGroupedBarsProps) {
  const maxValue = Math.max(...data.flatMap((item) => keys.map((key) => getChartNumber(item[key.key]))), 1)

  if (data.length === 0) return <UserStatsEmptyState />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {keys.map((key) => (
          <div key={key.key} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: key.color }} />
            {key.label}
          </div>
        ))}
      </div>

      {data.slice(0, 8).map((item, index) => (
        <div key={`${getChartLabel(item[nameKey])}-${index}`} className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {getChartLabel(item[nameKey])}
          </span>
          {keys.map((key) => {
            const value = getChartNumber(item[key.key])
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

            return (
              <div key={key.key} className="grid grid-cols-[1fr_40px] items-center gap-3">
                <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.04, duration: 0.65 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: key.color }}
                  />
                </div>
                <span className="text-right text-xs font-semibold text-slate-700 dark:text-white">{value}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
