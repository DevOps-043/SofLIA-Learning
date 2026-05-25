export type NotificationStatsTable = {
  Row: {
  action_taken_count: number | null
  avg_read_time_seconds: number | null
  created_at: string | null
  notification_type: string | null
  organization_id: string | null
  read_count: number | null
  sent_count: number | null
  stat_date: string
  stat_id: string
  updated_at: string | null
  user_id: string | null
}
  Insert: {
  action_taken_count?: number | null
  avg_read_time_seconds?: number | null
  created_at?: string | null
  notification_type?: string | null
  organization_id?: string | null
  read_count?: number | null
  sent_count?: number | null
  stat_date?: string
  stat_id?: string
  updated_at?: string | null
  user_id?: string | null
}
  Update: {
  action_taken_count?: number | null
  avg_read_time_seconds?: number | null
  created_at?: string | null
  notification_type?: string | null
  organization_id?: string | null
  read_count?: number | null
  sent_count?: number | null
  stat_date?: string
  stat_id?: string
  updated_at?: string | null
  user_id?: string | null
}
  Relationships: [
    { foreignKeyName: "notification_stats_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "notification_stats_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "notification_stats_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "notification_stats_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "notification_stats_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "notification_stats_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "notification_stats_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
