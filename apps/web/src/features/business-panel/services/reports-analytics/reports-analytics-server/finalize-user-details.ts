import type { ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { calculateAverage, calculatePercentage, calculateQualityScore, getLatestDate } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'

export function finalizeUserDetails(context: BuildContext): ReportsAnalyticsUserDetailRow[] {
  return Array.from(context.users.values())
    .map((stats) => {
      stats.detail.coursesAssigned = stats.assignedCourseIds.size || stats.progressByCourse.size
      stats.detail.coursesCompleted = stats.completedCourseIds.size
      stats.detail.averageCompletionDays = calculateAverage(stats.completionDays)
      stats.detail.averageProgress = calculateAverage(Array.from(stats.progressByCourse.values()))
      stats.detail.quizAverageScore = calculateAverage(stats.quizScores)
      stats.detail.qualityScore = calculateQualityScore([
        stats.detail.quizAverageScore,
        calculateAverage(stats.activityQualityScores),
        calculateAverage(stats.sofliaQualityScores),
        calculateAverage(stats.notesQualityScores),
      ])
      stats.detail.plannerAdherenceRate = calculatePercentage(
        stats.detail.completedSessions,
        stats.detail.plannedSessions,
      )
      stats.detail.lastActivityAt = getLatestDate(stats.lastActivityDates)
      return stats.detail
    })
    .sort((a, b) => {
      const progressDiff = b.overdueAssignments - a.overdueAssignments
      if (progressDiff !== 0) return progressDiff
      return a.displayName.localeCompare(b.displayName)
    })
}
