import type { ReportFilters, ReportType } from '../types/report-data.types'
import { generateActivityReport, generateProgressReport } from './report-data/engagement-reports.service'
import { generateLiaAnalysisReport } from './report-data/lia-report.service'
import {
  generateCertificatesReport,
  generateCompletionReport,
  generateTimeSpentReport,
} from './report-data/outcome-reports.service'
import { type ReportRuntime, type ReportSupabaseClient } from './report-data/shared'
import { generateCoursesReport, generateUsersReport } from './report-data/user-reports.service'

type ReportGenerator = (
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
  runtime: ReportRuntime,
) => Promise<any>

const reportGenerators: Record<ReportType, ReportGenerator> = {
  users: generateUsersReport,
  courses: generateCoursesReport,
  progress: generateProgressReport,
  activity: generateActivityReport,
  completion: generateCompletionReport,
  time_spent: generateTimeSpentReport,
  certificates: generateCertificatesReport,
  'lia-analysis': generateLiaAnalysisReport,
}

export async function generateBusinessReportData(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
) {
  const runtime: ReportRuntime = {}
  return reportGenerators[filters.report_type](supabase, organizationId, filters, runtime)
}
