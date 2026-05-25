export type UserLessonProgressTable = {
  Row: {
    completed_at: string | null
    created_at: string | null
    current_time_seconds: number | null
    enrollment_id: string
    is_completed: boolean | null
    last_accessed_at: string | null
    lesson_id: string
    lesson_status: string | null
    organization_id: string | null
    progress_id: string
    quiz_completed: boolean | null
    quiz_passed: boolean | null
    quiz_progress_percentage: number | null
    started_at: string | null
    time_spent_minutes: number | null
    updated_at: string | null
    user_id: string
    video_progress_percentage: number | null
  }
  Insert: {
    completed_at?: string | null
    created_at?: string | null
    current_time_seconds?: number | null
    enrollment_id: string
    is_completed?: boolean | null
    last_accessed_at?: string | null
    lesson_id: string
    lesson_status?: string | null
    organization_id?: string | null
    progress_id?: string
    quiz_completed?: boolean | null
    quiz_passed?: boolean | null
    quiz_progress_percentage?: number | null
    started_at?: string | null
    time_spent_minutes?: number | null
    updated_at?: string | null
    user_id: string
    video_progress_percentage?: number | null
  }
  Update: {
    completed_at?: string | null
    created_at?: string | null
    current_time_seconds?: number | null
    enrollment_id?: string
    is_completed?: boolean | null
    last_accessed_at?: string | null
    lesson_id?: string
    lesson_status?: string | null
    organization_id?: string | null
    progress_id?: string
    quiz_completed?: boolean | null
    quiz_passed?: boolean | null
    quiz_progress_percentage?: number | null
    started_at?: string | null
    time_spent_minutes?: number | null
    updated_at?: string | null
    user_id?: string
    video_progress_percentage?: number | null
  }
  Relationships: []
}
