export type UserStreaksTable = {
  Row: {
  created_at: string | null
  current_streak: number | null
  id: string
  last_session_date: string | null
  longest_streak: number | null
  month_start_date: string | null
  monthly_sessions_completed: number | null
  monthly_study_minutes: number | null
  organization_id: string | null
  total_sessions_completed: number | null
  total_sessions_missed: number | null
  total_sessions_rescheduled: number | null
  total_study_minutes: number | null
  updated_at: string | null
  user_id: string
  week_start_date: string | null
  weekly_sessions_completed: number | null
  weekly_study_minutes: number | null
}
  Insert: {
  created_at?: string | null
  current_streak?: number | null
  id?: string
  last_session_date?: string | null
  longest_streak?: number | null
  month_start_date?: string | null
  monthly_sessions_completed?: number | null
  monthly_study_minutes?: number | null
  organization_id?: string | null
  total_sessions_completed?: number | null
  total_sessions_missed?: number | null
  total_sessions_rescheduled?: number | null
  total_study_minutes?: number | null
  updated_at?: string | null
  user_id: string
  week_start_date?: string | null
  weekly_sessions_completed?: number | null
  weekly_study_minutes?: number | null
}
  Update: {
  created_at?: string | null
  current_streak?: number | null
  id?: string
  last_session_date?: string | null
  longest_streak?: number | null
  month_start_date?: string | null
  monthly_sessions_completed?: number | null
  monthly_study_minutes?: number | null
  organization_id?: string | null
  total_sessions_completed?: number | null
  total_sessions_missed?: number | null
  total_sessions_rescheduled?: number | null
  total_study_minutes?: number | null
  updated_at?: string | null
  user_id?: string
  week_start_date?: string | null
  weekly_sessions_completed?: number | null
  weekly_study_minutes?: number | null
}
  Relationships: [
    { foreignKeyName: "user_streaks_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_streaks_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_streaks_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_streaks_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_streaks_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_streaks_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_streaks_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
