export type UserTourProgressTable = {
  Row: {
  completed_at: string | null
  created_at: string | null
  id: string
  skipped_at: string | null
  step_reached: number | null
  tour_id: string
  updated_at: string | null
  user_id: string
}
  Insert: {
  completed_at?: string | null
  created_at?: string | null
  id?: string
  skipped_at?: string | null
  step_reached?: number | null
  tour_id: string
  updated_at?: string | null
  user_id: string
}
  Update: {
  completed_at?: string | null
  created_at?: string | null
  id?: string
  skipped_at?: string | null
  step_reached?: number | null
  tour_id?: string
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_tour_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_tour_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_tour_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_tour_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
