import type {
  ReportsAnalyticsQuality,
  ReportsAnalyticsUserDetailRow,
} from '../../../types/reports-analytics.types'
import { calculateAverage, calculatePercentage } from '../reports-analytics.helpers'
import { countIncludedActivities } from './count-included-activities'
import { isActiveLearner } from './is-active-learner'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { BuildContext } from './build-context'

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
  const plannerPlanned = userDetails.reduce((sum, user) => sum + user.plannedSessions, 0)
  const plannerCompleted = userDetails.reduce((sum, user) => sum + user.completedSessions, 0)
  const usersWithSoflia = userDetails.filter((user) => user.sofliaConversations > 0).length
  const usersWithNotes = userDetails.filter((user) => user.notesCreated > 0).length

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
    plannerAdherenceRate: calculatePercentage(plannerCompleted, plannerPlanned),
    quizAverageScore: calculateAverage(userDetails.map((user) => user.quizAverageScore)),
    qualityScore: quality.overallScore,
  }
}
