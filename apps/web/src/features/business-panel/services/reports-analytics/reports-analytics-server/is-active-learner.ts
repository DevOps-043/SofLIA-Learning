import type { ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'

export function isActiveLearner(user: ReportsAnalyticsUserDetailRow): boolean {
  return Boolean(
    user.coursesAssigned > 0 ||
      user.completedLessons > 0 ||
      user.timeSpentMinutes > 0 ||
      user.sofliaConversations > 0 ||
      user.notesCreated > 0 ||
      user.activitiesCompleted > 0 ||
      user.quizAttempts > 0 ||
      user.plannedSessions > 0,
  )
}
