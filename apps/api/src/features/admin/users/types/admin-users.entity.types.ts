import type { AdminUserStatusFilter } from './admin-users.schemas'

export interface AdminUser {
  id: string
  username: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  platform_role: string | null
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

export interface AdminUserMembership {
  organization_id: string
  organization_name: string | null
  organization_slug: string | null
  role: string | null
  status: string | null
}

export interface AdminUserListItem extends AdminUser {
  organization_name: string | null
  organization_slug: string | null
  organization_role: string | null
  membership_status: string | null
}

export interface AdminUserDetail extends AdminUser {
  memberships: AdminUserMembership[]
}

export interface NormalizedAdminUserListQuery {
  page: number
  limit: number
  from: number
  to: number
  search?: string
  role?: string
  status?: AdminUserStatusFilter
  activeSinceIso: string
}
