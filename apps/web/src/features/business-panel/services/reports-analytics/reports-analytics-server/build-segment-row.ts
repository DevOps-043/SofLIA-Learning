import type { ReportsAnalyticsSegmentRow, ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { calculateAverage, calculatePercentage } from '../reports-analytics.helpers'

export function buildSegmentRow(
  key: string,
  label: string,
  users: ReportsAnalyticsUserDetailRow[],
): ReportsAnalyticsSegmentRow {
  const assigned = users.reduce((sum, user) => sum + user.coursesAssigned, 0)
  const completed = users.reduce((sum, user) => sum + user.coursesCompleted, 0)
  const sofliaUsers = users.filter((user) => user.sofliaConversations > 0).length
  const notesUsers = users.filter((user) => user.notesCreated > 0).length

  return {
    key,
    label,
    users: users.length,
    averageProgress: calculateAverage(users.map((user) => user.averageProgress)),
    completionRate: calculatePercentage(completed, assigned),
    averageCompletionDays: calculateAverage(users.map((user) => user.averageCompletionDays).filter((value) => value > 0)),
    sofliaAdoptionRate: calculatePercentage(sofliaUsers, users.length),
    notesAdoptionRate: calculatePercentage(notesUsers, users.length),
    quizAverageScore: calculateAverage(users.map((user) => user.quizAverageScore)),
    qualityScore: calculateAverage(users.map((user) => user.qualityScore)),
  }
}
