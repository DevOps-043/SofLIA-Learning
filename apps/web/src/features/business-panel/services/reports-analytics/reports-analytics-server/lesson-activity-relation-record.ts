import type { CourseLessonRelationRecord } from './course-lesson-relation-record'
import type { Relation } from './relation'

export interface LessonActivityRelationRecord {
  activity_id: string
  activity_title: string | null
  activity_type: string | null
  lesson_id: string | null
  course_lessons: Relation<CourseLessonRelationRecord>
}
