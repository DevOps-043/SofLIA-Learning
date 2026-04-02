export const REPORT_TYPES = [
  'users',
  'courses',
  'progress',
  'activity',
  'completion',
  'time_spent',
  'certificates',
  'lia-analysis',
] as const

export type ReportType = (typeof REPORT_TYPES)[number]

export type ReportRole = 'owner' | 'admin' | 'member'
export type ReportRoleFilter = ReportRole | 'all' | (string & {})

export type ReportStatus = 'active' | 'invited' | 'suspended'
export type ReportStatusFilter = ReportStatus | 'all' | (string & {})

export interface ReportFilters {
  report_type: ReportType
  start_date?: string
  end_date?: string
  user_ids?: string[]
  course_ids?: string[]
  role?: ReportRoleFilter
  status?: ReportStatusFilter
}
