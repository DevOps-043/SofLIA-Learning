export type RefreshTokensTable = {
  Row: {
  created_at: string | null
  device_fingerprint: string | null
  expires_at: string
  id: string
  ip_address: string | null
  is_revoked: boolean | null
  last_used_at: string | null
  revoked_at: string | null
  revoked_reason: string | null
  token_hash: string
  user_agent: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  device_fingerprint?: string | null
  expires_at: string
  id?: string
  ip_address?: string | null
  is_revoked?: boolean | null
  last_used_at?: string | null
  revoked_at?: string | null
  revoked_reason?: string | null
  token_hash: string
  user_agent?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  device_fingerprint?: string | null
  expires_at?: string
  id?: string
  ip_address?: string | null
  is_revoked?: boolean | null
  last_used_at?: string | null
  revoked_at?: string | null
  revoked_reason?: string | null
  token_hash?: string
  user_agent?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "refresh_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "refresh_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "refresh_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "refresh_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
