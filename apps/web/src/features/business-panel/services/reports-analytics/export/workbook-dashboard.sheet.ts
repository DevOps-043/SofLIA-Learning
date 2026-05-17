
import type { Workbook } from 'exceljs'
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import type { ExportCopy } from './export.types'
import { formatDate } from './export-utils'
import { addExcelTable } from './excel-table'
import { addMetricCard, addStyledWorksheet, addTitleBlock, setColumns } from './excel-sheet'
import { buildExecutiveMetricRows } from './rows-summary'

export function buildDashboardWorkbookSheet(
  workbook: Workbook,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
  locale: ReportsAnalyticsLocale,
  blueprint: ReportsAnalyticsReportBlueprint,
): void {
  const sheet = addStyledWorksheet(workbook, copy.dashboard)
  setColumns(sheet, [22, 16, 22, 16, 22, 16, 22, 16])
  addTitleBlock(sheet, copy.dashboard, [
    `${copy.period}: ${formatDate(dataset.period.from, locale)} - ${formatDate(dataset.period.to, locale)}`,
    blueprint.summary,
  ], 8)

  const cards = [
    { label: copy.metrics.totalUsers, value: dataset.overview.totalUsers, detail: `${copy.metrics.activeLearners}: ${dataset.overview.activeLearners}` },
    { label: copy.metrics.averageProgress, value: `${dataset.overview.averageProgress}%`, detail: `${copy.metrics.completionRate}: ${dataset.overview.completionRate}%` },
    { label: copy.metrics.sofliaAdoptionRate, value: `${dataset.overview.sofliaAdoptionRate}%`, detail: `${dataset.soflia.totalConversations} conversaciones` },
    { label: copy.metrics.qualityScore, value: `${dataset.overview.qualityScore}%`, detail: `${dataset.quality.evidenceCount} evidencias` },
  ]
  cards.forEach((card, index) => {
    const startCol = index % 2 === 0 ? 1 : 5
    const startRow = index < 2 ? 6 : 10
    addMetricCard(sheet, startRow, startCol, card.label, card.value, card.detail)
  })

  addExcelTable(sheet, 'DashboardMetricsTable', 15, 1, [
    { key: 'metric', header: copy.metric, width: 32, kind: 'text' },
    { key: 'value', header: copy.value, width: 18, kind: 'text' },
    { key: 'detail', header: copy.detail, width: 48, kind: 'text' },
  ], buildExecutiveMetricRows(dataset, copy))

  addExcelTable(sheet, 'DashboardCourseRiskTable', 15, 5, [
    { key: 'course', header: copy.columns.course, width: 38, kind: 'text' },
    { key: 'progress', header: copy.columns.progress, width: 16, kind: 'percent' },
    { key: 'overdue', header: copy.columns.overdue, width: 12, kind: 'integer' },
  ], dataset.courses
    .slice()
    .sort((a, b) => b.overdueAssignments - a.overdueAssignments || a.averageProgress - b.averageProgress)
    .slice(0, 10)
    .map((course) => ({
      course: course.courseTitle,
      progress: course.averageProgress,
      overdue: course.overdueAssignments,
    })))
}
