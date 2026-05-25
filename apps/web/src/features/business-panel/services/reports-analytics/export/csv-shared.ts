
import type { ReportsAnalyticsTrendPoint } from '../../../types/reports-analytics.types'
import { buildCsv } from '../reports-analytics.helpers'
import type { ExportColumn, ExportCopy, ExportRow } from './export.types'

export function buildBreakdownCsv(rows: ExportRow[], copy: ExportCopy): string {
  return toCsv(rows, [
    { key: 'category', header: copy.columns.category },
    { key: 'label', header: copy.columns.label },
    { key: 'value', header: copy.columns.value },
    { key: 'percentage', header: copy.columns.percentage },
  ])
}

export function buildTrendCsv(
  rows: ReportsAnalyticsTrendPoint[],
  metric: string,
  granularity: string,
  copy: ExportCopy,
): string {
  return toCsv(
    rows.map((row) => ({
      period: row.label,
      granularity,
      metric,
      value: row.value,
      secondary: row.secondaryValue ?? '',
    })),
    [
      { key: 'period', header: copy.columns.period },
      { key: 'granularity', header: copy.columns.granularity },
      { key: 'metric', header: copy.metric },
      { key: 'value', header: copy.columns.value },
      { key: 'secondary', header: copy.columns.secondary },
    ],
  )
}

export function toCsv(rows: ExportRow[], columns: ExportColumn[]): string {
  return buildCsv(rows, columns as Array<{ key: keyof ExportRow; header: string }>)
}
