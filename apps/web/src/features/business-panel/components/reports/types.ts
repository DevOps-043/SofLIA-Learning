// Report data types for BusinessReports sub-components

export interface UsersReportData {
  total_users?: number
  users?: Array<{
    username?: string | null
    email?: string | null
    display_name?: string | null
    job_title?: string | null
    status?: string | null
    joined_at?: string | null
    last_login_at?: string | null
  }>
  summary?: {
    by_job_title?: Record<string, number>
    by_status?: Record<string, number>
  }
}

export interface ActivityReportData {
  total_activities?: number
  total_users?: number
  active_count?: number
  completed_count?: number
  inactive_count?: number
  total_sessions?: number
  active_users?: number
  completion_rate?: number
  activities?: Array<{
    user_name?: string | null
    course_title?: string | null
    enrollment_status?: string | null
    enrolled_at?: string | null
    last_accessed_at?: string | null
  }>
  activity_by_day?: { day: string; sessions: number }[]
  activity_by_module?: { module: string; completions: number }[]
  summary?: Record<string, number>
}

export interface CertificatesReportData {
  total_certificates?: number
  total_users_with_certificates?: number
  certificates?: Array<{
    user_name?: string | null
    course_title?: string | null
    course_category?: string | null
    issued_at?: string | null
    certificate_url?: string | null
  }>
  certificates_by_course?: { course: string; course_title?: string; count: number }[]
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
