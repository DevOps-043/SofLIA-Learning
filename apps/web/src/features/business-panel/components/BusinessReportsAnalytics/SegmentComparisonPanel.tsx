import { useMemo } from 'react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { EmptyChart } from './EmptyChart'
import { buildSegmentRows } from './segment-rows'
import { SegmentComparisonChart } from './SegmentComparisonChart'
import { SegmentInsightCard } from './SegmentInsightCard'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function SegmentComparisonPanel({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: ReportsAnalyticsT }) {
  const { rows, chartRows } = useMemo(() => buildSegmentRows(data, t), [data, t])

  return (
    <section className="overflow-hidden rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.segmentComparison')}</h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.segmentComparisonSubtitle')}</p>
      </div>
      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <div className="h-[420px] min-h-[320px] overflow-hidden">
          {chartRows.length > 0 ? (
            <SegmentComparisonChart chartRows={chartRows} theme={theme} t={t} />
          ) : (
            <EmptyChart theme={theme} />
          )}
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {rows.map((row) => <SegmentInsightCard key={`${row.segmentType}-${row.key}`} row={row} theme={theme} t={t} />)}
        </div>
      </div>
    </section>
  )
}
