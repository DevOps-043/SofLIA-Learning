import type { CourseModuleRelationRecord } from './course-module-relation-record'
import type { Relation } from './relation'

export interface CourseLessonRelationRecord {
  lesson_id: string
  module_id: string | null
  lesson_title?: string | null
  course_modules: Relation<CourseModuleRelationRecord>
}
