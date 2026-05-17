import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'

export function buildReportsAnalyticsInsightsFilename(
  dataset: Pick<ReportsAnalyticsDataset, 'period'>,
): string {
  const from = dataset.period.from.slice(0, 10)
  const to = dataset.period.to.slice(0, 10)
  return `soflia-insights-${from}-${to}.pdf`
}
