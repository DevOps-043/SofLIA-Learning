
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import { getCourseColumns, getMetricColumns, getUserColumns } from './columns-basic'
import type { ExportCopy } from './export.types'
import { formatDate } from './export-utils'
import { buildCourseProgressRows } from './rows-courses'
import { buildExecutiveMetricRows } from './rows-summary'
import { buildUserDetailRows } from './rows-users'
import { toCsv } from './csv-shared'

export function buildExecutiveSummaryCsv(
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
  locale: ReportsAnalyticsLocale,
  blueprint: ReportsAnalyticsReportBlueprint,
): string {
  return toCsv([
    { metric: copy.generatedAt, value: new Date(dataset.generatedAt).toLocaleString(locale), detail: '' },
    { metric: copy.period, value: `${formatDate(dataset.period.from, locale)} - ${formatDate(dataset.period.to, locale)}`, detail: '' },
    { metric: copy.summary, value: blueprint.summary, detail: blueprint.source },
    ...blueprint.featuredMetrics.map((metric) => ({
      metric: metric.label,
      value: metric.value,
      detail: metric.detail,
    })),
    ...blueprint.recommendations.slice(0, 5).map((recommendation, index) => ({
      metric: `Recomendacion ${index + 1}`,
      value: recommendation,
      detail: '',
    })),
    ...buildExecutiveMetricRows(dataset, copy),
  ], getMetricColumns(copy))
}

export function buildUsersDetailCsv(dataset: ReportsAnalyticsDataset, copy: ExportCopy): string {
  return toCsv(buildUserDetailRows(dataset), getUserColumns(copy))
}

export function buildCourseProgressCsv(dataset: ReportsAnalyticsDataset, copy: ExportCopy): string {
  return toCsv(buildCourseProgressRows(dataset), getCourseColumns(copy))
}
