
import type { Workbook } from 'exceljs'
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import { EXCEL_COLORS } from './export.colors'
import type { ExportCopy } from './export.types'
import { formatDate } from './export-utils'
import { applyBorder } from './excel-format'
import { addExcelTable } from './excel-table'
import { addSectionList, addStyledWorksheet, addTitleBlock, setColumns } from './excel-sheet'
import { buildExecutiveMetricRows } from './rows-summary'

export function buildExecutiveWorkbookSheet(
  workbook: Workbook,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
  locale: ReportsAnalyticsLocale,
  blueprint: ReportsAnalyticsReportBlueprint,
): void {
  const sheet = addStyledWorksheet(workbook, 'Resumen SofLIA')
  setColumns(sheet, [24, 18, 36, 18, 24, 18, 26, 18])
  addTitleBlock(sheet, copy.title, [
    `${copy.generatedAt}: ${new Date(dataset.generatedAt).toLocaleString(locale)}`,
    `${copy.period}: ${formatDate(dataset.period.from, locale)} - ${formatDate(dataset.period.to, locale)}`,
    `SofLIA: ${blueprint.source} (${blueprint.model})`,
  ], 8)

  sheet.mergeCells('A6:H8')
  const summaryCell = sheet.getCell('A6')
  summaryCell.value = blueprint.summary
  summaryCell.alignment = { vertical: 'middle', wrapText: true }
  summaryCell.font = { size: 12, color: { argb: EXCEL_COLORS.text } }
  summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.accentSoft } }
  applyBorder(summaryCell)

  addExcelTable(sheet, 'FeaturedMetricsTable', 10, 1, [
    { key: 'metric', header: copy.metric, width: 28, kind: 'text' },
    { key: 'value', header: copy.value, width: 18, kind: 'text' },
    { key: 'detail', header: copy.detail, width: 48, kind: 'text' },
  ], [
    ...blueprint.featuredMetrics.map((metric) => ({
      metric: metric.label,
      value: metric.value,
      detail: metric.detail,
    })),
    ...buildExecutiveMetricRows(dataset, copy),
  ])

  let nextRow = 10 + blueprint.featuredMetrics.length + buildExecutiveMetricRows(dataset, copy).length + 4
  nextRow = addSectionList(sheet, nextRow, copy.summary, blueprint.findings.flatMap((section) => [
    section.title,
    ...section.points.map((point) => `- ${point}`),
  ]))
  nextRow = addSectionList(sheet, nextRow + 1, 'Riesgos', blueprint.risks)
  addSectionList(sheet, nextRow + 1, 'Recomendaciones', blueprint.recommendations)
}
