import type { LessonProgressEnrollmentRecord } from './lesson-progress-enrollment-record'
import type { Relation } from './relation'

export interface LessonProgressRecord {
  progress_id: string
  user_id: string
  lesson_status: string | null
  is_completed: boolean | null
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  last_accessed_at: string | null
  updated_at: string | null
  enrollment_id: string | null
  lesson_id: string
  user_course_enrollments: Relation<LessonProgressEnrollmentRecord>
}
