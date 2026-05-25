import type { ReportsAnalyticsHierarchyRankingRow } from '../../types/reports-analytics.types'
import { CompactMetric } from './CompactMetric'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function HierarchyRankCard({
  row,
  rank,
  theme,
  t,
}: {
  row: ReportsAnalyticsHierarchyRankingRow
  rank: number
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  return (
    <article className="rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>
            {rank}. {t(`reportsAnalytics.hierarchy.${row.type}`)}
          </p>
          <h3 className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>{row.name}</h3>
        </div>
        <span className="rounded-lg px-2 py-1 text-sm font-semibold" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          {row.rankScore}%
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <CompactMetric label={t('reportsAnalytics.table.users')} value={String(row.users)} theme={theme} />
        <CompactMetric label={t('reportsAnalytics.table.progress')} value={`${row.averageProgress}%`} theme={theme} />
        <CompactMetric label={t('reportsAnalytics.table.quality')} value={`${row.qualityScore}%`} theme={theme} />
      </div>
    </article>
  )
}
