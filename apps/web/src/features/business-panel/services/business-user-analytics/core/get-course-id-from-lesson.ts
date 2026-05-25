import { CourseLessonRecord } from './course-lesson-record'
import { unwrapRelation } from './unwrap-relation'

export function getCourseIdFromLesson(lesson: CourseLessonRecord): string | null {
  return unwrapRelation(lesson.course_modules)?.course_id || null
}
