import type {
  BusinessUser,
  CreateBusinessUserRequest,
  UpdateBusinessUserRequest,
} from '../businessUsers.service'

export type OrganizationRole = NonNullable<BusinessUser['org_role']>
export type OrganizationStatus = NonNullable<BusinessUser['org_status']>

export type {
  BusinessUserProfileRow,
  OrganizationHierarchyRow,
  OrganizationUserWithProfileRow,
  UserInsertRow,
  UserUpdateRow,
} from './row.types'

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

export interface OrganizationUserUpdateRow {
  role?: OrganizationRole
  job_title?: string
  status?: OrganizationStatus
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
