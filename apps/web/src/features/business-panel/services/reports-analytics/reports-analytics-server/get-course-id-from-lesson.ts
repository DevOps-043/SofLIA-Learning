import { REPORTS_ANALYTICS_UNSPECIFIED } from '../reports-analytics.helpers'
import { unwrapRelation } from './unwrap-relation'
import type { CourseLessonRelationRecord } from './course-lesson-relation-record'
import type { Relation } from './relation'

export function getCourseIdFromLesson(relation: Relation<CourseLessonRelationRecord> | undefined): string {
  const lesson = unwrapRelation(relation || null)
  const module = unwrapRelation(lesson?.course_modules || null)
  return module?.course_id || REPORTS_ANALYTICS_UNSPECIFIED
}
