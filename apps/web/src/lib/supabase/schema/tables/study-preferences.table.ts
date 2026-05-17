export type StudyPreferencesTable = {
  Row: {
  break_duration_minutes: number | null
  calendar_connected: boolean | null
  calendar_provider: string | null
  created_at: string
  daily_target_minutes: number
  id: string
  max_session_minutes: number | null
  min_session_minutes: number | null
  preferred_days: number[]
  preferred_session_type: string | null
  preferred_time_of_day: string
  timezone: string
  updated_at: string
  user_id: string
  weekly_target_minutes: number
}
  Insert: {
  break_duration_minutes?: number | null
  calendar_connected?: boolean | null
  calendar_provider?: string | null
  created_at?: string
  daily_target_minutes?: number
  id?: string
  max_session_minutes?: number | null
  min_session_minutes?: number | null
  preferred_days?: number[]
  preferred_session_type?: string | null
  preferred_time_of_day?: string
  timezone?: string
  updated_at?: string
  user_id: string
  weekly_target_minutes?: number
}
  Update: {
  break_duration_minutes?: number | null
  calendar_connected?: boolean | null
  calendar_provider?: string | null
  created_at?: string
  daily_target_minutes?: number
  id?: string
  max_session_minutes?: number | null
  min_session_minutes?: number | null
  preferred_days?: number[]
  preferred_session_type?: string | null
  preferred_time_of_day?: string
  timezone?: string
  updated_at?: string
  user_id?: string
  weekly_target_minutes?: number
}
  Relationships: [
    { foreignKeyName: "study_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "study_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "study_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "study_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
