import type {
  ReportsAnalyticsBreakdownItem,
  ReportsAnalyticsTrendPoint,
} from './core.types'

export interface ReportsAnalyticsDemographics {
  gender: ReportsAnalyticsBreakdownItem[]
  ageBands: ReportsAnalyticsBreakdownItem[]
  jobTitles: ReportsAnalyticsBreakdownItem[]
  roles: ReportsAnalyticsBreakdownItem[]
  missingDateOfBirth: number
  missingGender: number
  missingJobTitle: number
}

export interface ReportsAnalyticsLearning {
  assignedCourses: number
  completedCourses: number
  inProgressCourses: number
  notStartedCourses: number
  overdueAssignments: number
  totalLessonsCompleted: number
  totalTimeSpentMinutes: number
  averageCompletionDays: number
  medianCompletionDays: number
  progressDistribution: ReportsAnalyticsBreakdownItem[]
  completionsTrend: ReportsAnalyticsTrendPoint[]
  completionsByMonth: ReportsAnalyticsTrendPoint[]
}

export interface ReportsAnalyticsCourseRow {
  courseId: string
  courseTitle: string
  assignedUsers: number
  activeLearners: number
  completedUsers: number
  averageProgress: number
  overdueAssignments: number
  notesCount: number
  sofliaConversations: number
  activityCompletionRate: number
  quizAverageScore: number
}

export interface ReportsAnalyticsSoflia {
  totalConversations: number
  totalMessages: number
  activeUsers: number
  averageMessagesPerConversation: number
  completionRate: number
  contextBreakdown: ReportsAnalyticsBreakdownItem[]
  conversationsTrend: ReportsAnalyticsTrendPoint[]
  conversationsByMonth: ReportsAnalyticsTrendPoint[]
}

export interface ReportsAnalyticsActivities {
  totalActivities: number
  completedActivities: number
  completionRate: number
  averageAttempts: number
  averageTimeMinutes: number
  usersNeedingHelp: number
  redirects: number
  totalEvaluations: number
  completedEvaluations: number
  evaluationCompletionRate: number
  quizAttempts: number
  quizPassRate: number
  quizAverageScore: number
  byType: ReportsAnalyticsBreakdownItem[]
}
