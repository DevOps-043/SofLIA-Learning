import type { Json } from '../json'

export type StudyPlansRow = {
  ai_generation_metadata: Json | null
  break_duration_minutes: number | null
  break_intervals: Json | null
  calendar_analyzed: boolean | null
  calendar_provider: string | null
  course_ids: string[] | null
  created_at: string
  description: string | null
  end_date: string | null
  generation_mode: string | null
  goal_hours_per_week: number
  id: string
  lia_availability_analysis: Json | null
  lia_time_analysis: Json | null
  max_session_minutes: number | null
  max_study_session_minutes: number | null
  min_rest_minutes: number | null
  min_session_minutes: number | null
  min_study_minutes: number | null
  name: string
  organization_id: string | null
  preferred_days: number[]
  preferred_session_type: string | null
  preferred_time_blocks: Json | null
  start_date: string | null
  timezone: string
  updated_at: string
  user_id: string
  user_type: string | null
}
