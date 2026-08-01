import type { ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'

export interface MutableUserStats {
  detail: ReportsAnalyticsUserDetailRow
  assignedCourseIds: Set<string>
  completedCourseIds: Set<string>
  progressByCourse: Map<string, number>
  completionDays: number[]
  completionDaysByCourse: Map<string, number>
  overdueCourseIds: Set<string>
  quizScores: number[]
  activityQualityScores: number[]
  lastActivityDates: string[]
  completedTrendCourseIds: Set<string>
}
