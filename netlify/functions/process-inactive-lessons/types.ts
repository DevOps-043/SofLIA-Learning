export interface LessonTracking {
  id: string
  user_id: string
  lesson_id: string
  session_id: string | null
  status: string
  lia_first_message_at: string | null
  lia_last_message_at: string | null
  post_content_start_at: string | null
  last_activity_at: string | null
  next_analysis_at: string | null
}

export interface TrackingProcessResult {
  completed: boolean
  reason?: string
}
