import type { Json } from '../json.types'

export type StudySessionRow = {
  actual_duration_minutes: number | null
  break_duration_minutes: number | null
  calendar_conflict_checked: boolean | null
  calendar_provider: string | null
  calendar_synced_at: string | null
  completed_at: string | null
  completion_method: string | null
  course_complexity: Json | null
  course_id: string | null
  created_at: string
  description: string | null
  due_date: string | null
  duration_minutes: number | null
  end_time: string
  external_event_id: string | null
  focus_area: string | null
  id: string
  is_ai_generated: boolean | null
  lesson_id: string | null
  lesson_min_time_minutes: number | null
  lia_suggested: boolean | null
  metrics: Json | null
  notes: string | null
  organization_id: string | null
  plan_id: string | null
  recurrence: Json | null
  rescheduled_from: string | null
  self_evaluation: number | null
  session_type: string | null
  start_time: string
  started_at: string | null
  status: string
  streak_day: number | null
  title: string
  updated_at: string
  user_id: string
  was_rescheduled: boolean | null
}
