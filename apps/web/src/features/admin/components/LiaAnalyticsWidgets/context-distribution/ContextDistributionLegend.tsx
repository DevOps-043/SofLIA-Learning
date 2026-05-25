'use client'

import type { ChartContextData } from './types'

interface ContextDistributionLegendProps {
  data: ChartContextData[]
}

export function ContextDistributionLegend({ data }: ContextDistributionLegendProps) {
  return (
    <div className="w-full space-y-2 lg:w-1/2">
      {data.map((item) => (
        <div key={item.contextType} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{item.count}</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-300">${item.cost.toFixed(4)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
