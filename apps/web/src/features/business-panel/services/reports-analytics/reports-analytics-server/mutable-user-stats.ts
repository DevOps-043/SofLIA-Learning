import type { ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'

export interface MutableUserStats {
  detail: ReportsAnalyticsUserDetailRow
  assignedCourseIds: Set<string>
  completedCourseIds: Set<string>
  progressByCourse: Map<string, number>
  completionDays: number[]
  quizScores: number[]
  activityQualityScores: number[]
  sofliaQualityScores: number[]
  notesQualityScores: number[]
  lastActivityDates: string[]
  completedTrendCourseIds: Set<string>
}
