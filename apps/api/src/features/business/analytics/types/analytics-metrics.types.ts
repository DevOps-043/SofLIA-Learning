import type { AnalyticsTeam, AnalyticsTeamsData } from './analytics-team.types'
import type { AnalyticsUser } from './analytics-user.types'
import type { AnalyticsOrganizationInfo } from './analytics-records.types'

export interface AnalyticsTrendData {
  date: string
  count: number
}

export interface AnalyticsRoleMetric {
  role: string
  count?: number
  average_progress?: number
  total_completed?: number
  average_hours?: number
}

export interface AnalyticsCourseDistribution {
  status: string
  count: number
}

export interface AnalyticsStickinessPoint {
  name: string
  dau: number
  mau: number
  ratio: number
}

export interface AnalyticsFrequencyPoint {
  name: string
  users: number
}

export interface AnalyticsStreakPoint {
  name: string
  value: number
}

export interface AnalyticsHeatmapPoint {
  day: string
  hour: string
  value: number
}

export interface AnalyticsDurationPoint {
  role: string
  median: number
  max: number
  count: number
}

export interface AnalyticsGeneralMetrics {
  total_users: number
  total_courses_assigned: number
  completed_courses: number
  average_progress: number
  total_time_hours: number
  total_certificates: number
  active_users: number
  retention_rate: number
}

export interface BusinessAnalyticsData {
  organization: AnalyticsOrganizationInfo
  general_metrics: AnalyticsGeneralMetrics
  user_analytics: AnalyticsUser[]
  trends: Record<
    'enrollments_by_month' | 'completions_by_month' | 'time_by_month' | 'active_users_by_month',
    AnalyticsTrendData[]
  >
  by_role: Record<
    'distribution' | 'progress_comparison' | 'completions' | 'time_spent',
    AnalyticsRoleMetric[]
  >
  course_metrics: { distribution: AnalyticsCourseDistribution[] }
  engagement_metrics: {
    stickiness: AnalyticsStickinessPoint[]
    frequency: AnalyticsFrequencyPoint[]
    streaks: AnalyticsStreakPoint[]
    heatmap: AnalyticsHeatmapPoint[]
    duration: AnalyticsDurationPoint[]
  }
  teams: AnalyticsTeamsData
}

export type { AnalyticsTeam, AnalyticsUser }
