export type PasswordResetTokensTable = {
  Row: {
  created_at: string | null
  expires_at: string
  id: string
  token: string
  used_at: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  expires_at: string
  id?: string
  token: string
  used_at?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  expires_at?: string
  id?: string
  token?: string
  used_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "fk_user"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "fk_user"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "fk_user"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "fk_user"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "password_reset_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "password_reset_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "password_reset_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "password_reset_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
