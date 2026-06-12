export interface LessonProgressRecord {
  progress_id: string
  enrollment_id: string
  lesson_id: string
  organization_id: string | null
  lesson_status: string | null
  is_completed: boolean | null
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  last_activity_submission_at: string | null
  last_accessed_at: string | null
  updated_at: string | null
  activity_progress_percentage: number | null
  quiz_progress_percentage: number | null
  quiz_completed: boolean | null
  quiz_passed: boolean | null
  required_activities_completed: number | null
  required_activities_total: number | null
}
