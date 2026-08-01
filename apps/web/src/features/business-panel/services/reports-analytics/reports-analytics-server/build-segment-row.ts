import type { ReportsAnalyticsSegmentRow, ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { calculatePercentage } from '../reports-analytics.helpers'

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
    averageProgress: weightedAverage(users, (user) => user.averageProgress, (user) => user.coursesAssigned),
    completionRate: calculatePercentage(completed, assigned),
    averageCompletionDays: weightedAverage(
      users.filter((user) => user.averageCompletionDays > 0),
      (user) => user.averageCompletionDays,
      (user) => user.coursesCompleted,
    ),
    sofliaAdoptionRate: calculatePercentage(sofliaUsers, users.length),
    notesAdoptionRate: calculatePercentage(notesUsers, users.length),
    quizAverageScore: weightedAverage(users, (user) => user.quizAverageScore, (user) => user.quizAttempts),
    qualityScore: weightedAverage(users, (user) => user.qualityScore, (user) => user.qualityEvidenceCount),
  }
}

function weightedAverage(
  users: ReportsAnalyticsUserDetailRow[],
  value: (user: ReportsAnalyticsUserDetailRow) => number,
  weight: (user: ReportsAnalyticsUserDetailRow) => number,
): number {
  const totalWeight = users.reduce((sum, user) => sum + weight(user), 0)
  if (totalWeight === 0) return 0

  return Math.round(
    (users.reduce((sum, user) => sum + value(user) * weight(user), 0) / totalWeight) * 10,
  ) / 10
}
