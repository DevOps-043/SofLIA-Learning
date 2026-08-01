import type {
  ReportsAnalyticsQuality,
  ReportsAnalyticsUserDetailRow,
} from '../../../types/reports-analytics.types'
import { calculateAverage, calculatePercentage } from '../reports-analytics.helpers'
import { countIncludedActivities } from './count-included-activities'
import { isActiveLearner } from './is-active-learner'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { BuildContext } from './build-context'
import { classifyPriorityUser } from './compute-priority-users'
import { getAssignmentStates } from './get-assignment-states'

const INACTIVE_THRESHOLD_DAYS = 14

export function buildOverviewMetrics(
  context: BuildContext,
  queryData: AnalyticsQueryData,
  userDetails: ReportsAnalyticsUserDetailRow[],
  quality: ReportsAnalyticsQuality,
) {
  const totalUsers = userDetails.length
  const activeLearners = userDetails.filter((user) => isActiveLearner(user)).length
  const assignmentStates = getAssignmentStates(context)
  const assignedCourses = assignmentStates.length
  const completedCourses = assignmentStates.filter((state) => state.completed).length
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

  // La tarjeta, el cumplimiento y la tabla de riesgo comparten exactamente la
  // misma clasificacion (incluido bajo avance). Antes la tabla podia mostrar mas
  // personas que el conteo ejecutivo/PDF.
  const atRiskUsersCount = assignedUsers.filter(
    (user) => classifyPriorityUser(user, referenceDate) !== null,
  ).length

  const atRiskRate = calculatePercentage(atRiskUsersCount, assignedUsersCount)
  const complianceRate = calculatePercentage(assignedUsersCount - atRiskUsersCount, assignedUsersCount)

  return {
    totalUsers,
    activeLearners,
    activeLearnerRate: calculatePercentage(activeLearners, totalUsers),
    averageProgress: calculateAverage(assignmentStates.map((state) => state.progress)),
    completionRate: calculatePercentage(completedCourses, assignedCourses),
    averageCompletionDays: calculateAverage(
      userDetails.map((user) => user.averageCompletionDays).filter((value) => value > 0),
    ),
    overdueAssignments: userDetails.reduce((sum, user) => sum + user.overdueAssignments, 0),
    sofliaAdoptionRate: calculatePercentage(usersWithSoflia, totalUsers),
    notesAdoptionRate: calculatePercentage(usersWithNotes, totalUsers),
    activityCompletionRate: calculatePercentage(activityCompleted, activityTotal),
    quizAverageScore: quality.quizAverageScore,
    qualityScore: quality.overallScore,
    assignedUsersCount,
    atRiskUsersCount,
    atRiskRate,
    inactiveUsersCount,
    complianceRate,
  }
}
