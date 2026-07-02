export interface AdminCompanyUserProfile {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
}

export interface AdminCompanyMember {
  id: string
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  user?: AdminCompanyUserProfile
}

export interface AdminCompany {
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
  branding_enabled: boolean
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  subscription_plan: string | null
  subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  is_active: boolean
  max_users: number | null
  total_users: number
  active_users: number
  invited_users: number
  suspended_users: number
  google_login_enabled: boolean
  microsoft_login_enabled: boolean
  created_at: string
  updated_at: string
  members: AdminCompanyMember[]
  pending_invitations?: Record<string, unknown>[]
  bulk_invite_links?: Record<string, unknown>[]
}
