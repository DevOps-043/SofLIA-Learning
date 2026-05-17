export type UsersTable = {
  Row: {
    id: string
    username: string | null
    email: string | null
    first_name: string | null
    last_name: string | null
    display_name: string | null
    cargo_rol: string | null
    type_rol: string | null
    email_verified: boolean
    email_verified_at: string | null
    phone: string | null
    bio: string | null
    location: string | null
    profile_picture_url: string | null
    country_code: string | null
    created_at: string | null
    updated_at: string | null
    last_login_at: string | null
    is_banned: boolean
    banned_at: string | null
    ban_reason: string | null
  }
  Insert: {
    id?: string
    username?: string | null
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    display_name?: string | null
    cargo_rol?: string | null
    type_rol?: string | null
    email_verified?: boolean
    email_verified_at?: string | null
    phone?: string | null
    bio?: string | null
    location?: string | null
    profile_picture_url?: string | null
    country_code?: string | null
    created_at?: string | null
    updated_at?: string | null
    last_login_at?: string | null
    is_banned?: boolean
    banned_at?: string | null
    ban_reason?: string | null
  }
  Update: {
    username?: string | null
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    display_name?: string | null
    cargo_rol?: string | null
    type_rol?: string | null
    email_verified?: boolean
    email_verified_at?: string | null
    phone?: string | null
    bio?: string | null
    location?: string | null
    profile_picture_url?: string | null
    country_code?: string | null
    updated_at?: string | null
    last_login_at?: string | null
    is_banned?: boolean
    banned_at?: string | null
    ban_reason?: string | null
  }
  Relationships: []
}
