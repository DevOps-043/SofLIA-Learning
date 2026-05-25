import { useMemo } from 'react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { buildCalendarMonthLabels, buildCalendarWeeks } from './calendar.utils'
import { EmptyChart } from './EmptyChart'
import { HeatmapGrid } from './HeatmapGrid'
import { HeatmapLegend } from './HeatmapLegend'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'

export function LoginHeatmapCard({
  data,
  theme,
  t,
  locale,
}: {
  data: ReportsAnalyticsResponse
  theme: ThemeTokens
  t: ReportsAnalyticsT
  locale: ReportsAnalyticsLocale
}) {
  const weeks = useMemo(() => buildCalendarWeeks(data.connectionCalendar), [data.connectionCalendar])
  const monthLabels = useMemo(() => buildCalendarMonthLabels(weeks, locale), [weeks, locale])

  return (
    <section className="rounded-lg border p-4 xl:col-span-2" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.loginHeatmap')}</h2>
          <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.loginHeatmapSubtitle')}</p>
        </div>
        <HeatmapLegend theme={theme} t={t} />
      </div>
      {weeks.length > 0 ? (
        <HeatmapGrid locale={locale} monthLabels={monthLabels} theme={theme} t={t} weeks={weeks} />
      ) : (
        <div className="mt-5 h-32"><EmptyChart theme={theme} /></div>
      )}
    </section>
  )
}
