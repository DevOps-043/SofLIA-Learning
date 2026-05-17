import type {
  BusinessUserAnalyticsBreakdownItem,
  BusinessUserAnalyticsTrendPoint,
} from './common.types'

export interface BusinessUserAnalyticsCourseProgressRow {
  courseId: string
  courseTitle: string
  progress: number
  status: string
  assignedAt: string | null
  dueDate: string | null
  completedAt: string | null
  lastAccessedAt: string | null
  lessonsCompleted: number
  timeSpentMinutes: number
  hasCertificate: boolean
}

export interface BusinessUserAnalyticsLearning {
  courses: BusinessUserAnalyticsCourseProgressRow[]
  progressDistribution: BusinessUserAnalyticsBreakdownItem[]
  completionsTrend: BusinessUserAnalyticsTrendPoint[]
  lessonTrend: BusinessUserAnalyticsTrendPoint[]
}
