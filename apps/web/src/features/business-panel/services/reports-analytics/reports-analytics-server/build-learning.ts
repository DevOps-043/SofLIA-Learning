import type { ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_PROGRESS_BANDS, buildBreakdown, buildPeriodTrend, calculateAverage, calculateMedian, getProgressBand, incrementMap } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'

export function buildLearning(context: BuildContext, userDetails: ReportsAnalyticsUserDetailRow[]) {
  const progressCounts = new Map<string, number>(
    REPORTS_ANALYTICS_PROGRESS_BANDS.map((band) => [band, 0]),
  )

  userDetails.forEach((user) => {
    incrementMap(progressCounts, getProgressBand(user.averageProgress))
  })

  const assignedCourses = userDetails.reduce((sum, user) => sum + user.coursesAssigned, 0)
  const completedCourses = userDetails.reduce((sum, user) => sum + user.coursesCompleted, 0)
  const completionDays = userDetails.map((user) => user.averageCompletionDays).filter((value) => value > 0)
  const completionsTrend = buildPeriodTrend(context.completionTrendCounts, context.filters)

  return {
    assignedCourses,
    completedCourses,
    inProgressCourses: userDetails.filter((user) => user.averageProgress > 0 && user.averageProgress < 100).length,
    notStartedCourses: userDetails.filter((user) => user.averageProgress === 0).length,
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
