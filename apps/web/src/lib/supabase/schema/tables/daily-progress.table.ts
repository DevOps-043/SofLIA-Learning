export type DailyProgressTable = {
  Row: {
  created_at: string | null
  had_activity: boolean | null
  id: string
  organization_id: string | null
  progress_date: string
  sessions_completed: number | null
  sessions_missed: number | null
  streak_count: number | null
  study_minutes: number | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  had_activity?: boolean | null
  id?: string
  organization_id?: string | null
  progress_date: string
  sessions_completed?: number | null
  sessions_missed?: number | null
  streak_count?: number | null
  study_minutes?: number | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  had_activity?: boolean | null
  id?: string
  organization_id?: string | null
  progress_date?: string
  sessions_completed?: number | null
  sessions_missed?: number | null
  streak_count?: number | null
  study_minutes?: number | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "daily_progress_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "daily_progress_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "daily_progress_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "daily_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "daily_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "daily_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "daily_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
