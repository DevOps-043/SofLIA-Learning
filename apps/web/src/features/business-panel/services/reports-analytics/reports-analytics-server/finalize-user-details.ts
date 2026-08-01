import type { ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { calculateAverage, getLatestDate } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'

export function finalizeUserDetails(context: BuildContext): ReportsAnalyticsUserDetailRow[] {
  return Array.from(context.users.values())
    .map((stats) => {
      stats.completionDays = Array.from(stats.completionDaysByCourse.values())
      stats.detail.coursesAssigned = stats.assignedCourseIds.size || stats.progressByCourse.size
      stats.detail.coursesCompleted = stats.completedCourseIds.size
      stats.detail.overdueAssignments = stats.overdueCourseIds.size
      stats.detail.averageCompletionDays = calculateAverage(stats.completionDays)
      stats.detail.averageProgress = calculateAverage(Array.from(stats.progressByCourse.values()))
      stats.detail.quizAverageScore = calculateAverage(stats.quizScores)
      const evaluatedEvidence = [...stats.quizScores, ...stats.activityQualityScores]
      stats.detail.qualityEvidenceCount = evaluatedEvidence.length
      stats.detail.qualityScore = calculateAverage(evaluatedEvidence)
      stats.detail.lastActivityAt = getLatestDate(stats.lastActivityDates)
      return stats.detail
    })
    .sort((a, b) => {
      const progressDiff = b.overdueAssignments - a.overdueAssignments
      if (progressDiff !== 0) return progressDiff
      return a.displayName.localeCompare(b.displayName)
    })
}
