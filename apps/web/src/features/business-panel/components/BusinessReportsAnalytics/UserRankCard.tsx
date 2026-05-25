import type { ReportsAnalyticsUserRankingRow } from '../../types/reports-analytics.types'
import { CompactMetric } from './CompactMetric'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function UserRankCard({
  row,
  rank,
  theme,
  t,
}: {
  row: ReportsAnalyticsUserRankingRow
  rank: number
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  return (
    <article className="rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>
            {rank}. {row.teamName}
          </p>
          <h3 className="mt-1 truncate text-sm font-semibold" style={{ color: theme.textColor }}>{row.displayName}</h3>
          <p className="mt-1 text-xs" style={{ color: theme.subtextColor }}>{row.jobTitle}</p>
        </div>
        <span className="w-fit rounded-lg px-2 py-1 text-sm font-semibold" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          {row.rankScore}%
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <CompactMetric label={t('reportsAnalytics.table.progress')} value={`${row.averageProgress}%`} theme={theme} />
        <CompactMetric label={t('reportsAnalytics.table.completion')} value={`${row.completionRate}%`} theme={theme} />
        <CompactMetric label={t('reportsAnalytics.table.quality')} value={`${row.qualityScore}%`} theme={theme} />
      </div>
    </article>
  )
}
