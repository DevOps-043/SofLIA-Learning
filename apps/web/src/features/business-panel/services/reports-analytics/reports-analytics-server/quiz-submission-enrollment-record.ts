import type { CourseRelationRecord } from './course-relation-record'
import type { Relation } from './relation'

export interface QuizSubmissionEnrollmentRecord {
  course_id: string
  courses: Relation<CourseRelationRecord>
}
