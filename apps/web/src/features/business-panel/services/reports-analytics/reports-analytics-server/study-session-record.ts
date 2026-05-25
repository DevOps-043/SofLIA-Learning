import type { CourseRelationRecord } from './course-relation-record'
import type { Relation } from './relation'

export interface StudySessionRecord {
  id: string
  user_id: string
  course_id: string | null
  status: string
  start_time: string
  end_time: string
  completed_at: string | null
  started_at: string | null
  duration_minutes: number | null
  actual_duration_minutes: number | null
  was_rescheduled: boolean | null
  updated_at: string
  courses: Relation<CourseRelationRecord>
}
