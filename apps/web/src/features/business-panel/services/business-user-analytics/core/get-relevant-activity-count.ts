import { LessonActivityRecord } from './lesson-activity-record'

export function getRelevantActivityCount(lessonActivities: LessonActivityRecord[]): number {
  if (lessonActivities.length === 0) return 0
  const requiredCount = lessonActivities.filter((activity) => activity.is_required !== false).length
  return requiredCount > 0 ? requiredCount : lessonActivities.length
}
