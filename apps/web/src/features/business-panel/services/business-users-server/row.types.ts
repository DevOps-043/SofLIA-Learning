import type { UserGender } from '../../../../lib/schemas/user-demographics.schema'

export interface BusinessUserProfileRow {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  platform_role: string | null
  email_verified: boolean | null
  profile_picture_url: string | null
  bio: string | null
  location: string | null
  phone: string | null
  date_of_birth: string | null
  gender: UserGender | null
  last_login_at: string | null
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationUserWithProfileRow {
  organization_id: string
  user_id: string
  role: string | null
  job_title: string | null
  status: string | null
  joined_at: string | null
  users: BusinessUserProfileRow | BusinessUserProfileRow[] | null
}

export interface UserInsertRow {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  platform_role: string
  date_of_birth?: string | null
  gender?: UserGender | null
}

export interface UserUpdateRow {
  first_name?: string
  last_name?: string
  display_name?: string
  email?: string
  platform_role?: string
  profile_picture_url?: string
  bio?: string
  location?: string
  phone?: string
  date_of_birth?: string | null
  gender?: UserGender | null
}

export interface OrganizationHierarchyRow {
  hierarchy_enabled: boolean | null
  hierarchy_config: Record<string, unknown> | null
}
