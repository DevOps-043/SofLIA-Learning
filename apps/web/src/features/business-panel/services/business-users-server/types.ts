import type {
  BusinessUser,
  CreateBusinessUserRequest,
  UpdateBusinessUserRequest,
} from '../businessUsers.service'

export type OrganizationRole = NonNullable<BusinessUser['org_role']>
export type OrganizationStatus = NonNullable<BusinessUser['org_status']>

export interface BusinessUserProfileRow {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  cargo_rol: string | null
  email_verified: boolean | null
  profile_picture_url: string | null
  bio: string | null
  location: string | null
  phone: string | null
  points: number | null
  last_login_at: string | null
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

export interface OrganizationUserSummaryRow {
  role: string | null
  status: string | null
}

export interface PendingInvitationRow {
  role: string | null
}

export interface BulkInviteUsageRow {
  current_uses: number | null
}

export interface UserInsertRow {
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  cargo_rol: string
  password_hash: string
}

export interface UserUpdateRow {
  first_name?: string
  last_name?: string
  display_name?: string
  email?: string
  cargo_rol?: string
  profile_picture_url?: string
  bio?: string
  location?: string
  phone?: string
}

export interface OrganizationUserUpdateRow {
  role?: OrganizationRole
  job_title?: string
  status?: OrganizationStatus
}

export interface OrganizationHierarchyRow {
  hierarchy_enabled: boolean | null
  hierarchy_config: Record<string, unknown> | null
}

export interface OrganizationNodeRow {
  id: string
}

export interface CertificateRow {
  certificate_id: string
}

export interface ScormAttemptRow {
  id: string
}

export interface UserPerfilRow {
  id: string
}

export interface CreateUserErrorShape {
  code?: string
  message?: string
  details?: string
  constraint?: string
}

export interface DeleteTarget {
  tableName: string
  column?: string
}

export type CreateUserInput = CreateBusinessUserRequest
export type UpdateUserInput = UpdateBusinessUserRequest
