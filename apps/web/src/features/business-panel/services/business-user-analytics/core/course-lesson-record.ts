import { Relation } from './relation'

export interface CourseLessonRecord {
  lesson_id: string
  duration_seconds: number | null
  total_duration_minutes: number | null
  course_modules: Relation<{
    course_id: string | null
  }>
}
