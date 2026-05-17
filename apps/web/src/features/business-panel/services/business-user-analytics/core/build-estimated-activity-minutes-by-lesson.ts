import { getNonNegativeNumber } from './get-non-negative-number'
import { LessonActivityRecord } from './lesson-activity-record'

export function buildEstimatedActivityMinutesByLesson(
  lessonActivities: LessonActivityRecord[],
): Map<string, number> {
  const map = new Map<string, number>()
  lessonActivities.forEach((activity) => {
    map.set(
      activity.lesson_id,
      (map.get(activity.lesson_id) || 0) + getNonNegativeNumber(activity.estimated_time_minutes),
    )
  })
  return map
}
