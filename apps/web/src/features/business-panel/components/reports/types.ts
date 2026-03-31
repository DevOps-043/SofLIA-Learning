// Report data types for BusinessReports sub-components

export interface UsersReportData {
  total_users?: number
  users?: Record<string, unknown>[]
  summary?: {
    by_job_title?: Record<string, number>
    by_status?: Record<string, number>
  }
}

export interface ActivityReportData {
  total_sessions?: number
  active_users?: number
  completion_rate?: number
  activity_by_day?: { day: string; sessions: number }[]
  activity_by_module?: { module: string; completions: number }[]
  summary?: Record<string, number>
}

export interface CertificatesReportData {
  total_certificates?: number
  certificates_by_course?: { course: string; count: number }[]
  certificates_by_month?: { month: string; count: number }[]
  top_users?: { name: string; count: number }[]
}

export interface LiaAnalysisReportData {
  total_interactions?: number
  popular_topics?: { topic: string; count: number }[]
  activities?: { name: string; score?: number }[]
  engagement_score?: number
  recommendations?: string[]
  [key: string]: unknown
}

export type ReportData =
  | UsersReportData
  | ActivityReportData
  | CertificatesReportData
  | LiaAnalysisReportData
  | Record<string, unknown>
