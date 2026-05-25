import type { LiaAnalyticsChartType, LiaAnalyticsPeriod, LiaAnalyticsProvider } from './lia-analytics.types'

export const LIA_PERIOD_OPTIONS: Array<{ value: LiaAnalyticsPeriod; labelKey: string }> = [
  { value: 'day', labelKey: 'liaAnalyticsPage.period.day' },
  { value: 'week', labelKey: 'liaAnalyticsPage.period.week' },
  { value: 'month', labelKey: 'liaAnalyticsPage.period.month' },
  { value: 'year', labelKey: 'liaAnalyticsPage.period.year' },
]

export const LIA_PROVIDER_OPTIONS: Array<{ value: LiaAnalyticsProvider; label: string }> = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
]

export const LIA_CHART_OPTIONS: Array<{ value: LiaAnalyticsChartType; labelKey: string }> = [
  { value: 'area', labelKey: 'liaAnalyticsPage.chart.area' },
  { value: 'bar', labelKey: 'liaAnalyticsPage.chart.bar' },
]
