import type { ReportsAnalyticsConnectionCalendarCell } from '../../types/reports-analytics.types'
import { getConnectionCalendarColor } from './calendar.utils'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function HeatmapLegend({ theme, t }: { theme: ThemeTokens; t: ReportsAnalyticsT }) {
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: theme.subtextColor }}>
      <span>{t('reportsAnalytics.chart.less')}</span>
      {[0, 1, 2, 3, 4].map((level) => (
        <span
          key={level}
          className="h-3 w-3 rounded-[3px] border"
          style={{
            backgroundColor: getConnectionCalendarColor(level as ReportsAnalyticsConnectionCalendarCell['level'], theme),
            borderColor: theme.dividerColor,
          }}
        />
      ))}
      <span>{t('reportsAnalytics.chart.more')}</span>
    </div>
  )
}
