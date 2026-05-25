import { calculatePercentage, clampPercentage } from '../../reports-analytics/reports-analytics.helpers'
import { getNonNegativeNumber } from './get-non-negative-number'
import { LessonProgressRecord } from './lesson-progress-record'

export function normalizeLessonActivityProgress(progress: LessonProgressRecord): number {
  if (progress.activity_progress_percentage === null || progress.activity_progress_percentage === undefined) {
    const requiredTotal = getNonNegativeNumber(progress.required_activities_total)
    if (requiredTotal > 0) {
      return calculatePercentage(
        getNonNegativeNumber(progress.required_activities_completed),
        requiredTotal,
      )
    }

    return 0
  }

  const explicitProgress = Number(progress.activity_progress_percentage)
  if (Number.isFinite(explicitProgress)) {
    return clampPercentage(explicitProgress)
  }

  const requiredTotal = getNonNegativeNumber(progress.required_activities_total)
  if (requiredTotal > 0) {
    return calculatePercentage(
      getNonNegativeNumber(progress.required_activities_completed),
      requiredTotal,
    )
  }

  return 0
}
