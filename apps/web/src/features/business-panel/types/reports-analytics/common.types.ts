export type ReportsAnalyticsExportFormat = 'csv_zip' | 'xlsx' | 'pdf'
export type ReportsAnalyticsLocale = 'es' | 'en' | 'pt'
export type ReportsAnalyticsTimeGranularity = 'day' | 'month' | 'year'
export type ReportsAnalyticsReportSectionId =
  | 'executive'
  | 'dashboard'
  | 'trends'
  | 'courses'
  | 'users'
  | 'segments'
  | 'quality'
  | 'rawData'

export interface ReportsAnalyticsFilters {
  from: string
  to: string
  granularity: ReportsAnalyticsTimeGranularity
  courseId?: string
  gender?: string
  ageBand?: string
  jobTitle?: string
  role?: string
  status?: string
  regionId?: string
  zoneId?: string
  teamId?: string
}

export interface ReportsAnalyticsExportRequest extends ReportsAnalyticsFilters {
  format: ReportsAnalyticsExportFormat
  locale?: ReportsAnalyticsLocale
}

export interface ReportsAnalyticsBreakdownItem {
  key: string
  label: string
  value: number
  percentage: number
}

export interface ReportsAnalyticsTrendPoint {
  key: string
  label: string
  value: number
  secondaryValue?: number
}

export interface ReportsAnalyticsOverview {
  totalUsers: number
  activeLearners: number
  activeLearnerRate: number
  averageProgress: number
  completionRate: number
  averageCompletionDays: number
  overdueAssignments: number
  sofliaAdoptionRate: number
  notesAdoptionRate: number
  activityCompletionRate: number
  quizAverageScore: number
  qualityScore: number
}
