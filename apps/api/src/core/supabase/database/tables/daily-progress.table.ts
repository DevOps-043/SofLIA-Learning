export type DailyProgressTable = {
  Row: {
    user_id: string
    progress_date: string
    had_activity: boolean | null
    streak_count: number | null
    study_minutes: number | null
    sessions_completed: number | null
    sessions_missed: number | null
  }
  Insert: {
    user_id: string
    progress_date: string
    had_activity?: boolean | null
    streak_count?: number | null
    study_minutes?: number | null
    sessions_completed?: number | null
    sessions_missed?: number | null
  }
  Update: {
    had_activity?: boolean | null
    streak_count?: number | null
    study_minutes?: number | null
    sessions_completed?: number | null
    sessions_missed?: number | null
  }
  Relationships: []
}
