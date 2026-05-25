import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { BreakdownCard } from './BreakdownCard'
import { LoginHeatmapCard } from './LoginHeatmapCard'
import { TrendCard } from './TrendCard'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'
import type { useReportFormatters } from './useReportFormatters'

export function ReportsChartsGrid({
  data,
  formatters,
  locale,
  theme,
  t,
}: {
  data: ReportsAnalyticsResponse
  formatters: ReturnType<typeof useReportFormatters>
  locale: ReportsAnalyticsLocale
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  return (
    <div id="tour-reports-charts" className="grid gap-5 xl:grid-cols-2">
      <LoginHeatmapCard data={data} theme={theme} t={t} locale={locale} />
      <TrendCard title={t('reportsAnalytics.sections.learningTrend')} subtitle={t('reportsAnalytics.sections.learningTrendSubtitle')} data={data.learning.completionsTrend} theme={theme} valueLabel={t('reportsAnalytics.chart.completedCourses')} />
      <BreakdownCard title={t('reportsAnalytics.sections.demographics')} subtitle={t('reportsAnalytics.sections.demographicsSubtitle')} data={data.demographics.ageBands} labelFormatter={formatters.formatAgeBands} theme={theme} variant="horizontalBar" />
      <BreakdownCard title={t('reportsAnalytics.sections.gender')} subtitle={t('reportsAnalytics.sections.genderSubtitle')} data={data.demographics.gender} labelFormatter={formatters.formatGender} theme={theme} variant="donut" />
      <BreakdownCard title={t('reportsAnalytics.sections.progress')} subtitle={t('reportsAnalytics.sections.progressSubtitle')} data={data.learning.progressDistribution} labelFormatter={formatters.formatProgress} theme={theme} variant="radial" />
      <BreakdownCard title={t('reportsAnalytics.sections.jobTitles')} subtitle={t('reportsAnalytics.sections.jobTitlesSubtitle')} data={data.demographics.jobTitles} labelFormatter={formatters.formatJobTitles} theme={theme} variant="horizontalBar" />
      <TrendCard title={t('reportsAnalytics.sections.sofliaTrend')} subtitle={t('reportsAnalytics.sections.sofliaTrendSubtitle')} data={data.soflia.conversationsTrend} theme={theme} valueLabel={t('reportsAnalytics.chart.conversations')} />
    </div>
  )
}
