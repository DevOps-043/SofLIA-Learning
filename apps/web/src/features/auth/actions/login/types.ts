import type { createAdminClient } from '@/lib/supabase/admin'
import type { createClient } from '@/lib/supabase/server'

export type LoginSupabaseClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>

export interface LoginUserRecord {
  ban_reason: string | null
  cargo_rol: string | null
  display_name?: string | null
  email: string | null
  email_verified: boolean | null
  first_name?: string | null
  id: string
  is_banned: boolean | null
  last_name?: string | null
  password_hash: string | null
  profile_picture_url?: string | null
  username: string | null
}

export interface OrganizationMembershipRedirectRow {
  organization_id: string
  organizations:
    | { slug: string | null }
    | Array<{ slug: string | null }>
    | null
}

export interface OrganizationSummary {
  id?: string
  is_active?: boolean | null
  name?: string | null
  slug: string | null
}

export interface ActiveOrganizationMembershipRow {
  organization_id: string
  organizations: OrganizationSummary | OrganizationSummary[] | null
  role: string | null
}

export interface UserOrganizationMembershipRow {
  organization_id: string
  organizations: OrganizationSummary | OrganizationSummary[] | null
  role: string | null
  status: string
}
