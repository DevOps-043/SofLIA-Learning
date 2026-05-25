
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'

export function buildReportsAnalyticsFilename(
  extension: 'zip' | 'xlsx' | 'pdf',
  dataset: Pick<ReportsAnalyticsDataset, 'period'>,
): string {
  const from = dataset.period.from.slice(0, 10)
  const to = dataset.period.to.slice(0, 10)
  return `soflia-analytics-${from}-${to}.${extension}`
}
