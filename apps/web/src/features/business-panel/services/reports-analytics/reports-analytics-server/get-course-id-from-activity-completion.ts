import { getCourseIdFromLesson } from './get-course-id-from-lesson'
import { unwrapRelation } from './unwrap-relation'
import type { ActivityCompletionRecord } from './activity-completion-record'

export function getCourseIdFromActivityCompletion(record: ActivityCompletionRecord): string {
  const activity = unwrapRelation(record.lesson_activities)
  return getCourseIdFromLesson(activity?.course_lessons)
}
