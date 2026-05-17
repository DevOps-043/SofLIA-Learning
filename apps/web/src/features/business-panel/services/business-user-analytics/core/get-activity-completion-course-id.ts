import { ActivityCompletionRecord } from './activity-completion-record'
import { unwrapRelation } from './unwrap-relation'

export function getActivityCompletionCourseId(completion: ActivityCompletionRecord): string | null {
  const activity = unwrapRelation(completion.lesson_activities)
  const lesson = unwrapRelation(activity?.course_lessons || null)
  return unwrapRelation(lesson?.course_modules || null)?.course_id || null
}
