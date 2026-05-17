import type { ReportsAnalyticsBreakdownItem } from '../../types/reports-analytics.types'
import type { ThemeTokens } from './types'

export function BreakdownLegend({
  data,
  theme,
}: {
  data: Array<ReportsAnalyticsBreakdownItem & { fill: string }>
  theme: ThemeTokens
}) {
  return (
    <div className="max-h-28 min-h-0 space-y-2 overflow-y-auto pr-1 md:max-h-none">
      {data.slice(0, 8).map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="truncate" style={{ color: theme.subtextColor }}>{item.label}</span>
          </div>
          <span className="shrink-0 font-semibold" style={{ color: theme.textColor }}>
            {item.value} - {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  )
}
