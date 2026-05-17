import type { CourseRelationRecord } from './course-relation-record'
import type { Relation } from './relation'

export interface AssignmentRecord {
  id: string
  user_id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
  updated_at: string | null
  courses: Relation<CourseRelationRecord>
}
