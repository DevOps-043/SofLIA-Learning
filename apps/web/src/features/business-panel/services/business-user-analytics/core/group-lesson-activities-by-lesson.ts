import { LessonActivityRecord } from './lesson-activity-record'

export function groupLessonActivitiesByLesson(
  lessonActivities: LessonActivityRecord[],
): Map<string, LessonActivityRecord[]> {
  const map = new Map<string, LessonActivityRecord[]>()
  lessonActivities.forEach((activity) => {
    map.set(activity.lesson_id, [...(map.get(activity.lesson_id) || []), activity])
  })
  return map
}
