import type {
  ReportsAnalyticsQuality,
  ReportsAnalyticsUserDetailRow,
} from '../../../types/reports-analytics.types'
import { calculateAverage, calculatePercentage } from '../reports-analytics.helpers'
import { countIncludedActivities } from './count-included-activities'
import { isActiveLearner } from './is-active-learner'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { BuildContext } from './build-context'

const INACTIVE_THRESHOLD_DAYS = 14

export function buildOverviewMetrics(
  context: BuildContext,
  queryData: AnalyticsQueryData,
  userDetails: ReportsAnalyticsUserDetailRow[],
  quality: ReportsAnalyticsQuality,
) {
  const totalUsers = userDetails.length
  const activeLearners = userDetails.filter((user) => isActiveLearner(user)).length
  const assignedCourses = userDetails.reduce((sum, user) => sum + user.coursesAssigned, 0)
  const completedCourses = userDetails.reduce((sum, user) => sum + user.coursesCompleted, 0)
  const activityTotal = countIncludedActivities(context, queryData)
  const activityCompleted = userDetails.reduce((sum, user) => sum + user.activitiesCompleted, 0)
  const usersWithSoflia = userDetails.filter((user) => user.sofliaConversations > 0).length
  const usersWithNotes = userDetails.filter((user) => user.notesCreated > 0).length

  const referenceDate = new Date(context.filters.to)
  const inactiveThresholdMs = INACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  const assignedUsers = userDetails.filter((u) => u.coursesAssigned > 0)
  const assignedUsersCount = assignedUsers.length

  const inactiveUsersCount = assignedUsers.filter((u) => {
    if (!u.lastActivityAt) return true
    return referenceDate.getTime() - new Date(u.lastActivityAt).getTime() > inactiveThresholdMs
  }).length

  const atRiskUsersCount = assignedUsers.filter((u) => {
    if (u.overdueAssignments > 0) return true
    if (u.averageProgress === 0) return true
    if (!u.lastActivityAt) return true
    return referenceDate.getTime() - new Date(u.lastActivityAt).getTime() > inactiveThresholdMs
  }).length

  const atRiskRate = calculatePercentage(atRiskUsersCount, assignedUsersCount)
  const complianceRate = calculatePercentage(assignedUsersCount - atRiskUsersCount, assignedUsersCount)

  return {
    totalUsers,
    activeLearners,
    activeLearnerRate: calculatePercentage(activeLearners, totalUsers),
    averageProgress: calculateAverage(userDetails.map((user) => user.averageProgress)),
    completionRate: calculatePercentage(completedCourses, assignedCourses),
    averageCompletionDays: calculateAverage(userDetails.map((user) => user.averageCompletionDays)),
    overdueAssignments: userDetails.reduce((sum, user) => sum + user.overdueAssignments, 0),
    sofliaAdoptionRate: calculatePercentage(usersWithSoflia, totalUsers),
    notesAdoptionRate: calculatePercentage(usersWithNotes, totalUsers),
    activityCompletionRate: calculatePercentage(activityCompleted, activityTotal),
    quizAverageScore: calculateAverage(userDetails.map((user) => user.quizAverageScore)),
    qualityScore: quality.overallScore,
    assignedUsersCount,
    atRiskUsersCount,
    atRiskRate,
    inactiveUsersCount,
    complianceRate,
  }
}
