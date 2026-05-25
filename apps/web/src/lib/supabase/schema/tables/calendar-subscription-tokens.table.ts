export type CalendarSubscriptionTokensTable = {
  Row: {
  created_at: string | null
  id: string
  last_used_at: string | null
  token: string
  usage_count: number | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  id?: string
  last_used_at?: string | null
  token?: string
  usage_count?: number | null
  user_id: string
}
  Update: {
  created_at?: string | null
  id?: string
  last_used_at?: string | null
  token?: string
  usage_count?: number | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "calendar_subscription_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "calendar_subscription_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "calendar_subscription_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "calendar_subscription_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
