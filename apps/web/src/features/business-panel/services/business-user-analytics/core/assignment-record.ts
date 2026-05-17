import { CourseRelationRecord } from './course-relation-record'
import { Relation } from './relation'

export interface AssignmentRecord {
  id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
  updated_at: string | null
  courses: Relation<CourseRelationRecord>
}
