export type UserCalendarSubscriptionsView = {
  Row: {
  active_sessions_count: number | null
  created_at: string | null
  has_calendar_integrations: boolean | null
  last_used_at: string | null
  token: string | null
  usage_count: number | null
  user_id: string | null
}
  Insert: {
  active_sessions_count?: never
  created_at?: string | null
  has_calendar_integrations?: never
  last_used_at?: string | null
  token?: string | null
  usage_count?: number | null
  user_id?: string | null
}
  Update: {
  active_sessions_count?: never
  created_at?: string | null
  has_calendar_integrations?: never
  last_used_at?: string | null
  token?: string | null
  usage_count?: number | null
  user_id?: string | null
}
  Relationships: [
    { foreignKeyName: "calendar_subscription_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "calendar_subscription_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "calendar_subscription_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "calendar_subscription_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
