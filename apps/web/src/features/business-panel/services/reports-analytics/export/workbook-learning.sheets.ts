
import type { Workbook } from 'exceljs'
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import { getWorkbookCourseColumns, getWorkbookSegmentColumns, getWorkbookUserColumns } from './columns-workbook'
import type { ExportCopy } from './export.types'
import { addExcelTable } from './excel-table'
import { addStyledWorksheet, addTitleBlock, setColumns } from './excel-sheet'
import { buildCourseProgressRows } from './rows-courses'
import { buildSegmentRows } from './rows-segments'
import { buildUserDetailRows } from './rows-users'

export function buildTrendsWorkbookSheet(
  workbook: Workbook,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
): void {
  const sheet = addStyledWorksheet(workbook, copy.trends)
  setColumns(sheet, [18, 22, 22, 22, 22, 22])
  addTitleBlock(sheet, copy.trends, [copy.metrics.completionRate, copy.metrics.totalConversations], 6)
  addExcelTable(sheet, 'TrendsTable', 6, 1, [
    { key: 'period', header: copy.columns.period, width: 18, kind: 'text' },
    { key: 'completionRate', header: copy.metrics.completionRate, width: 20, kind: 'integer' },
    { key: 'sofliaConversations', header: copy.metrics.totalConversations, width: 22, kind: 'integer' },
    { key: 'granularity', header: copy.columns.granularity, width: 18, kind: 'text' },
  ], dataset.learning.completionsTrend.map((point, index) => ({
    period: point.label,
    completionRate: point.value,
    sofliaConversations: dataset.soflia.conversationsTrend[index]?.value || 0,
    granularity: dataset.filters.granularity,
  })))
}

export function buildCoursesWorkbookSheet(
  workbook: Workbook,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
): void {
  const sheet = addStyledWorksheet(workbook, copy.courses)
  addTitleBlock(sheet, copy.courses, [copy.columns.progress, copy.columns.overdue], 11)
  addExcelTable(sheet, 'CoursesTable', 6, 1, getWorkbookCourseColumns(copy), buildCourseProgressRows(dataset))
}

export function buildUsersWorkbookSheet(
  workbook: Workbook,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
): void {
  const sheet = addStyledWorksheet(workbook, copy.users)
  addTitleBlock(sheet, copy.users, [copy.columns.email, copy.columns.progress], 12)
  addExcelTable(sheet, 'UsersTable', 6, 1, getWorkbookUserColumns(copy), buildUserDetailRows(dataset))
}

export function buildSegmentsWorkbookSheet(
  workbook: Workbook,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
): void {
  const sheet = addStyledWorksheet(workbook, copy.segments)
  addTitleBlock(sheet, copy.segments, [copy.columns.segmentType, copy.columns.quality], 10)
  addExcelTable(sheet, 'SegmentsTable', 6, 1, getWorkbookSegmentColumns(copy), buildSegmentRows(dataset, copy))
}
