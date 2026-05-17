import { FileText } from 'lucide-react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { SummaryCard } from './SummaryCard'
import { translateDimension } from './translations'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function DataQualityPanel({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: ReportsAnalyticsT }) {
  const totalUsers = Math.max(data.overview.totalUsers, 1)
  const missingRows = data.dataQuality.missingFields.map((item) => ({
    ...item,
    label: translateDimension(t, 'missingFields', item),
  }))

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
      <SummaryCard
        title={t('reportsAnalytics.sections.dataQuality')}
        icon={FileText}
        theme={theme}
        rows={[
          [t('reportsAnalytics.metrics.demographicsCompletionRate'), `${data.dataQuality.demographicsCompletionRate}%`],
          [t('reportsAnalytics.metrics.usersWithCompleteDemographics'), data.dataQuality.usersWithCompleteDemographics],
          [t('reportsAnalytics.metrics.usersMissingDemographics'), data.dataQuality.usersMissingDemographics],
        ]}
      />
      <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.missingFields')}</h2>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.missingFieldsSubtitle')}</p>
          </div>
          <div className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            {data.dataQuality.demographicsCompletionRate}%
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {missingRows.map((item) => (
            <MissingFieldMeter key={item.key} item={item} theme={theme} totalUsers={totalUsers} t={t} />
          ))}
        </div>
      </section>
    </section>
  )
}

function MissingFieldMeter({
  item,
  theme,
  totalUsers,
  t,
}: {
  item: { key: string; label: string; value: number; percentage: number }
  theme: ThemeTokens
  totalUsers: number
  t: ReportsAnalyticsT
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span style={{ color: theme.textColor }}>{item.label}</span>
        <span className="font-semibold" style={{ color: theme.subtextColor }}>
          {item.value} {t('reportsAnalytics.chart.missingUsers')} - {item.percentage}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min((item.value / totalUsers) * 100, 100)}%`, backgroundColor: item.value > 0 ? theme.warningColor : theme.successColor }}
        />
      </div>
    </div>
  )
}
