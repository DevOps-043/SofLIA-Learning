
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import { getExportCopy } from './export-copy'
import { resolveExportBlueprint } from './export-blueprint'
import { buildDashboardWorkbookSheet } from './workbook-dashboard.sheet'
import { buildExecutiveWorkbookSheet } from './workbook-executive.sheet'
import {
  buildCoursesWorkbookSheet,
  buildSegmentsWorkbookSheet,
  buildTrendsWorkbookSheet,
  buildUsersWorkbookSheet,
} from './workbook-learning.sheets'
import { buildQualityWorkbookSheet, buildRawDataWorkbookSheet } from './workbook-quality.sheets'

export async function generateReportsAnalyticsWorkbook(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale = 'es',
  blueprint?: ReportsAnalyticsReportBlueprint,
): Promise<Uint8Array> {
  const ExcelJS = await import('exceljs')
  const copy = getExportCopy(locale)
  const reportBlueprint = resolveExportBlueprint(dataset, locale, blueprint)
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'SofLIA'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.properties.date1904 = false

  buildExecutiveWorkbookSheet(workbook, dataset, copy, locale, reportBlueprint)
  buildDashboardWorkbookSheet(workbook, dataset, copy, locale, reportBlueprint)
  buildTrendsWorkbookSheet(workbook, dataset, copy)
  buildCoursesWorkbookSheet(workbook, dataset, copy)
  buildUsersWorkbookSheet(workbook, dataset, copy)
  buildSegmentsWorkbookSheet(workbook, dataset, copy)
  buildQualityWorkbookSheet(workbook, dataset, copy)
  buildRawDataWorkbookSheet(workbook, dataset, copy)

  const output = await workbook.xlsx.writeBuffer()
  return output instanceof Uint8Array ? output : new Uint8Array(output)
}
