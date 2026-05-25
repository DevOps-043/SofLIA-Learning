import type { ReportsAnalyticsAiInsights } from '../../types/reports-analytics.types'
import { InsightList } from './InsightList'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function AiInsightsContent({
  insights,
  theme,
  t,
}: {
  insights: ReportsAnalyticsAiInsights | null
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  if (!insights) {
    return (
      <div className="mt-5 rounded-lg border p-4 text-sm" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>
        {t('reportsAnalytics.ai.empty')}
      </div>
    )
  }

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-3">
      <div className="rounded-lg border p-4 xl:col-span-3" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
        <p className="text-sm leading-6" style={{ color: theme.textColor }}>{insights.summary}</p>
      </div>
      {insights.executiveMetrics?.map((metric) => (
        <div key={`${metric.label}-${metric.value}`} className="rounded-lg border p-4" style={{ borderColor: theme.borderColor }}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: theme.textColor }}>{metric.value}</p>
          <p className="mt-2 text-sm leading-5" style={{ color: theme.subtextColor }}>{metric.detail}</p>
        </div>
      ))}
      {insights.findings.map((section) => (
        <InsightList key={section.title} title={section.title} rows={section.points} theme={theme} />
      ))}
      <InsightList title={t('reportsAnalytics.ai.risks')} rows={insights.risks} theme={theme} />
      <InsightList title={t('reportsAnalytics.ai.recommendations')} rows={insights.recommendations} theme={theme} />
      {insights.actionPlan?.map((section) => (
        <InsightList key={section.title} title={section.title} rows={section.points} theme={theme} />
      ))}
    </div>
  )
}
