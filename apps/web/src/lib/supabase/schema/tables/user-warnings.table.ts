export type UserWarningsTable = {
  Row: {
  blocked_content: string | null
  content_id: string | null
  content_type: string
  created_at: string
  reason: string
  user_id: string
  warning_id: string
}
  Insert: {
  blocked_content?: string | null
  content_id?: string | null
  content_type: string
  created_at?: string
  reason: string
  user_id: string
  warning_id?: string
}
  Update: {
  blocked_content?: string | null
  content_id?: string | null
  content_type?: string
  created_at?: string
  reason?: string
  user_id?: string
  warning_id?: string
}
  Relationships: [
    { foreignKeyName: "user_warnings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_warnings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_warnings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_warnings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
