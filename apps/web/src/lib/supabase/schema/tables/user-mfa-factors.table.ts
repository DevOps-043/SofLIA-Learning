export type UserMfaFactorsTable = {
  Row: {
    created_at: string
    factor_type: 'totp'
    id: string
    issuer: string
    label: string | null
    last_used_at: string | null
    recovery_codes_hashed: string[]
    revoked_at: string | null
    secret_encrypted: string
    status: 'pending' | 'active' | 'revoked'
    user_id: string
    verified_at: string | null
  }
  Insert: {
    created_at?: string
    factor_type?: 'totp'
    id?: string
    issuer?: string
    label?: string | null
    last_used_at?: string | null
    recovery_codes_hashed?: string[]
    revoked_at?: string | null
    secret_encrypted: Uint8Array | string
    status?: 'pending' | 'active' | 'revoked'
    user_id: string
    verified_at?: string | null
  }
  Update: {
    created_at?: string
    factor_type?: 'totp'
    id?: string
    issuer?: string
    label?: string | null
    last_used_at?: string | null
    recovery_codes_hashed?: string[]
    revoked_at?: string | null
    secret_encrypted?: Uint8Array | string
    status?: 'pending' | 'active' | 'revoked'
    user_id?: string
    verified_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: 'user_mfa_factors_user_id_fkey'
      columns: ['user_id']
      isOneToOne: false
      referencedRelation: 'users'
      referencedColumns: ['id']
    },
  ]
}
