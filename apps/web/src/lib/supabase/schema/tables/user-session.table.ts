export type UserSessionTable = {
  Row: {
  expires_at: string
  id: string
  ip: unknown
  issued_at: string
  jwt_id: string | null
  revoked: boolean
  user_agent: string | null
  user_id: string
}
  Insert: {
  expires_at: string
  id?: string
  ip?: unknown
  issued_at?: string
  jwt_id?: string | null
  revoked?: boolean
  user_agent?: string | null
  user_id: string
}
  Update: {
  expires_at?: string
  id?: string
  ip?: unknown
  issued_at?: string
  jwt_id?: string | null
  revoked?: boolean
  user_agent?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_session_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_session_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_session_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_session_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
