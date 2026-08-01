import type { ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_PROGRESS_BANDS, buildBreakdown, buildPeriodTrend, calculateAverage, calculateMedian, getProgressBand, incrementMap } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'
import { getAssignmentStates } from './get-assignment-states'

export function buildLearning(context: BuildContext, userDetails: ReportsAnalyticsUserDetailRow[]) {
  const progressCounts = new Map<string, number>(
    REPORTS_ANALYTICS_PROGRESS_BANDS.map((band) => [band, 0]),
  )

  userDetails.forEach((user) => {
    incrementMap(progressCounts, getProgressBand(user.averageProgress))
  })

  const assignmentStates = getAssignmentStates(context)
  const assignedCourses = assignmentStates.length
  const completedCourses = assignmentStates.filter((state) => state.completed).length
  const completionDays = userDetails.map((user) => user.averageCompletionDays).filter((value) => value > 0)
  const completionsTrend = buildPeriodTrend(context.completionTrendCounts, context.filters)

  return {
    assignedCourses,
    completedCourses,
    inProgressCourses: assignmentStates.filter(
      (state) => !state.completed && state.progress > 0,
    ).length,
    notStartedCourses: assignmentStates.filter(
      (state) => !state.completed && state.progress === 0,
    ).length,
    overdueAssignments: userDetails.reduce((sum, user) => sum + user.overdueAssignments, 0),
    totalLessonsCompleted: userDetails.reduce((sum, user) => sum + user.completedLessons, 0),
    totalTimeSpentMinutes: userDetails.reduce((sum, user) => sum + user.timeSpentMinutes, 0),
    averageCompletionDays: calculateAverage(completionDays),
    medianCompletionDays: calculateMedian(completionDays),
    progressDistribution: buildBreakdown(progressCounts, userDetails.length),
    completionsTrend,
    completionsByMonth: completionsTrend,
  }
}
