import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { overviewMetricKeys } from './constants'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function OverviewGrid({
  data,
  theme,
  t,
}: {
  data: ReportsAnalyticsResponse
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {overviewMetricKeys.map((metric) => {
        const Icon = metric.icon
        const rawValue = data.overview[metric.valueKey]
        const value = metric.isPercent ? `${rawValue}%` : rawValue
        const suffix = metric.suffixKey ? `${data.overview[metric.suffixKey]}%` : null

        return (
          <article key={metric.key} className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.mutedTextColor }}>
                  {t(`reportsAnalytics.overview.${metric.key}`)}
                </p>
                <p className="mt-3 text-3xl font-semibold" style={{ color: theme.textColor }}>{value}</p>
                {suffix ? <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{suffix}</p> : null}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
