import type { AdminCompanyUserProfile } from '../../types/admin-companies.types'

export interface OrganizationUserProfileRow {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
}

export interface OrganizationUserRow {
  id: string
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  users?: OrganizationUserProfileRow | null
}

export interface OrganizationRow {
  id: string
  name: string
  slug: string | null
  description: string | null
  logo_url: string | null
  brand_logo_url: string | null
  brand_banner_url: string | null
  brand_favicon_url: string | null
  brand_color_primary: string | null
  brand_color_secondary: string | null
  brand_color_accent: string | null
  brand_font_family: string | null
  branding_enabled: boolean | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  subscription_plan: string | null
  subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  is_active: boolean | null
  max_users: number | null
  created_at: string | null
  updated_at: string | null
  google_login_enabled: boolean | null
  microsoft_login_enabled: boolean | null
  organization_users?: OrganizationUserRow[] | null
}

export interface MapOrganizationOptions {
  usersMap?: Map<string, AdminCompanyUserProfile>
  memberRoles?: string[]
  pendingInvitationCount?: number
  pendingInvitations?: Record<string, unknown>[]
  bulkInviteLinks?: Record<string, unknown>[]
}
