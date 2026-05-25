export type OauthAccountsTable = {
  Row: {
  access_token: string | null
  created_at: string | null
  id: string
  provider: string
  provider_account_id: string
  refresh_token: string | null
  scope: string | null
  token_expires_at: string | null
  token_type: string | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  access_token?: string | null
  created_at?: string | null
  id?: string
  provider: string
  provider_account_id: string
  refresh_token?: string | null
  scope?: string | null
  token_expires_at?: string | null
  token_type?: string | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  access_token?: string | null
  created_at?: string | null
  id?: string
  provider?: string
  provider_account_id?: string
  refresh_token?: string | null
  scope?: string | null
  token_expires_at?: string | null
  token_type?: string | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "fk_oauth_user"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "fk_oauth_user"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "fk_oauth_user"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "fk_oauth_user"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "oauth_accounts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "oauth_accounts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "oauth_accounts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "oauth_accounts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
