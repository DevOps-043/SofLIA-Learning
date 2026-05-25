import { CompactMetric } from './CompactMetric'
import { ProgressMeter } from './ProgressMeter'
import type { ReportsAnalyticsT, SegmentDisplayRow, ThemeTokens } from './types'

export function SegmentInsightCard({ row, theme, t }: { row: SegmentDisplayRow; theme: ThemeTokens; t: ReportsAnalyticsT }) {
  return (
    <article className="rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>{row.segmentLabel}</p>
          <h3 className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>{row.label}</h3>
        </div>
        <span className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          {row.users} {t('reportsAnalytics.table.users')}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <ProgressMeter label={t('reportsAnalytics.table.progress')} value={row.averageProgress} theme={theme} color={theme.actionColor} />
        <ProgressMeter label={t('reportsAnalytics.table.completion')} value={row.completionRate} theme={theme} color={theme.successColor} />
        <div className="grid grid-cols-3 gap-2 text-center">
          <CompactMetric label={t('reportsAnalytics.table.soflia')} value={`${row.sofliaAdoptionRate}%`} theme={theme} />
          <CompactMetric label={t('reportsAnalytics.table.notes')} value={`${row.notesAdoptionRate}%`} theme={theme} />
          <CompactMetric label={t('reportsAnalytics.table.quality')} value={`${row.qualityScore}%`} theme={theme} />
        </div>
      </div>
    </article>
  )
}
