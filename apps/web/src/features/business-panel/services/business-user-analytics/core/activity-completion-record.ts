import { Relation } from './relation'

export interface ActivityCompletionRecord {
  completion_id: string
  activity_id: string
  organization_id: string | null
  status: string | null
  completed_steps: number | null
  total_steps: number | null
  time_to_complete_seconds: number | null
  attempts_to_complete: number | null
  completed_at: string | null
  started_at: string | null
  updated_at: string | null
  lesson_activities: Relation<{
    activity_id: string
    lesson_id: string | null
    course_lessons: Relation<{
      lesson_id: string
      course_modules: Relation<{
        course_id: string | null
      }>
    }>
  }>
}
