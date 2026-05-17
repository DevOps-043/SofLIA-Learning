import type { createClient } from '@/lib/supabase/server'

export type LoginSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface LoginUserRecord {
  ban_reason: string | null
  cargo_rol: string | null
  email: string | null
  email_verified: boolean | null
  id: string
  is_banned: boolean | null
  password_hash: string | null
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
