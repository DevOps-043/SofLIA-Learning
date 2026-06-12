export interface StudySessionRecord {
  id: string
  enrollment_id: string | null
  course_id: string | null
  organization_id: string | null
  status: string
  start_time: string
  end_time: string
  completed_at: string | null
  started_at: string | null
  duration_minutes: number | null
  actual_duration_minutes: number | null
  was_rescheduled: boolean | null
  updated_at: string
}
