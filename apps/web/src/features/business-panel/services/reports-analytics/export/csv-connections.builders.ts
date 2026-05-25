
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import { getSegmentColumns } from './columns-basic'
import type { ExportCopy } from './export.types'
import { translateWeekday } from './export-utils'
import { buildSegmentRows } from './rows-segments'
import { toCsv } from './csv-shared'

export function buildLoginHeatmapCsv(dataset: ReportsAnalyticsDataset, copy: ExportCopy): string {
  return toCsv(
    dataset.loginHeatmap.map((cell) => ({
      day: translateWeekday(cell.dayKey),
      hour: cell.hourLabel,
      value: cell.value,
      percentage: cell.percentage,
    })),
    [
      { key: 'day', header: copy.columns.day },
      { key: 'hour', header: copy.columns.hour },
      { key: 'value', header: 'Conexiones' },
      { key: 'percentage', header: copy.columns.intensity },
    ],
  )
}

export function buildConnectionCalendarCsv(dataset: ReportsAnalyticsDataset, copy: ExportCopy): string {
  return toCsv(
    dataset.connectionCalendar.map((cell) => ({
      date: cell.date,
      day: translateWeekday(cell.dayKey),
      value: cell.value,
      intensity: cell.level,
    })),
    [
      { key: 'date', header: copy.columns.date },
      { key: 'day', header: copy.columns.day },
      { key: 'value', header: 'Conexiones' },
      { key: 'intensity', header: copy.columns.intensity },
    ],
  )
}

export function buildSegmentAnalysisCsv(dataset: ReportsAnalyticsDataset, copy: ExportCopy): string {
  return toCsv(buildSegmentRows(dataset, copy), getSegmentColumns(copy))
}
