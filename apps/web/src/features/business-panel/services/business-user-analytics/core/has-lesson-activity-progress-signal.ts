import { getNonNegativeNumber } from './get-non-negative-number'
import { LessonProgressRecord } from './lesson-progress-record'
import { normalizeLessonActivityProgress } from './normalize-lesson-activity-progress'

export function hasLessonActivityProgressSignal(progress: LessonProgressRecord): boolean {
  return (
    getNonNegativeNumber(progress.required_activities_total) > 0 ||
    getNonNegativeNumber(progress.required_activities_completed) > 0 ||
    normalizeLessonActivityProgress(progress) > 0 ||
    Boolean(progress.last_activity_submission_at)
  )
}
