
import type { Workbook } from 'exceljs'
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import { getMetricColumns } from './columns-basic'
import type { ExportCopy } from './export.types'
import { translateDimension } from './export-utils'
import { addExcelTable } from './excel-table'
import { addStyledWorksheet, addTitleBlock, setColumns } from './excel-sheet'
import { buildActivitiesRows, buildQualityRows } from './rows-activities'
import { buildExecutiveMetricRows } from './rows-summary'
import { withCategory } from './rows-segments'

export function buildQualityWorkbookSheet(
  workbook: Workbook,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
): void {
  const sheet = addStyledWorksheet(workbook, copy.quality)
  setColumns(sheet, [34, 18, 44, 24, 18, 18])
  addTitleBlock(sheet, copy.quality, [copy.metrics.qualityScore], 6)
  const nextRow = addExcelTable(sheet, 'QualityMetricsTable', 6, 1, [
    { key: 'metric', header: copy.metric, width: 34, kind: 'text' },
    { key: 'value', header: copy.value, width: 18, kind: 'text' },
    { key: 'detail', header: copy.detail, width: 44, kind: 'text' },
  ], buildQualityRows(dataset, copy))
  addExcelTable(sheet, 'DataQualityTable', nextRow + 2, 1, [
    { key: 'category', header: copy.columns.category, width: 32, kind: 'text' },
    { key: 'label', header: copy.columns.label, width: 36, kind: 'text' },
    { key: 'value', header: copy.columns.value, width: 16, kind: 'integer' },
    { key: 'percentage', header: copy.columns.percentage, width: 18, kind: 'percent' },
  ], withCategory('Campo faltante', dataset.dataQuality.missingFields, copy))
}

export function buildRawDataWorkbookSheet(
  workbook: Workbook,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
): void {
  const sheet = addStyledWorksheet(workbook, 'Datos crudos')
  setColumns(sheet, [28, 22, 22, 22, 22, 22, 22, 22])
  addTitleBlock(sheet, 'Datos crudos', [copy.dataQuality], 8)
  let nextRow = addExcelTable(sheet, 'RawOverviewTable', 6, 1, [
    { key: 'metric', header: copy.metric, width: 34, kind: 'text' },
    { key: 'value', header: copy.value, width: 18, kind: 'text' },
    { key: 'detail', header: copy.detail, width: 44, kind: 'text' },
  ], buildExecutiveMetricRows(dataset, copy))
  nextRow = addExcelTable(sheet, 'RawActivitiesTable', nextRow + 2, 1, getMetricColumns(copy), buildActivitiesRows(dataset, copy))
  addExcelTable(sheet, 'RawAiSamplesTable', nextRow + 2, 1, [
    { key: 'source', header: copy.columns.source, width: 24, kind: 'text' },
    { key: 'course', header: copy.columns.course, width: 36, kind: 'text' },
    { key: 'text', header: copy.columns.text, width: 72, kind: 'text' },
  ], dataset.aiSamples.slice(0, 30).map((sample) => ({
    source: translateDimension(copy, 'source', sample.source),
    course: sample.courseTitle || '',
    text: sample.text,
  })))
}
