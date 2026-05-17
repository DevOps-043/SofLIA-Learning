import {
  normalizeDateOfBirthForStorage,
  normalizeGenderForStorage,
} from '../../../../../lib/schemas/user-demographics.schema'
import type { CreateBusinessUserRequest, UpdateBusinessUserRequest } from '../../businessUsers.service'
import type { OrganizationUserUpdateRow, UserInsertRow, UserUpdateRow } from '../types'
import { normalizeOrganizationRole, normalizeOrganizationStatus } from './business-users-normalizers'
import { assertValidBusinessUserDemographics } from './business-users-validation'

export function buildUserInsertData(
  userData: CreateBusinessUserRequest,
  passwordHash: string,
): UserInsertRow {
  return {
    username: userData.username,
    email: userData.email,
    first_name: userData.first_name ?? null,
    last_name: userData.last_name ?? null,
    display_name: userData.display_name ?? null,
    date_of_birth: normalizeDateOfBirthForStorage(userData.date_of_birth),
    gender: normalizeGenderForStorage(userData.gender),
    cargo_rol: 'Business',
    password_hash: passwordHash,
  }
}

export function buildOrganizationUserInsertData(
  organizationId: string,
  userId: string,
  userData: CreateBusinessUserRequest,
  createdBy: string,
  nowIso: string,
) {
  return {
    organization_id: organizationId,
    user_id: userId,
    role: normalizeOrganizationRole(userData.org_role),
    job_title: userData.job_title.trim(),
    status: 'active' as const,
    invited_by: createdBy,
    invited_at: nowIso,
    joined_at: nowIso,
  }
}

export function buildUserUpdateData(
  userData: UpdateBusinessUserRequest,
): UserUpdateRow {
  const updateData: UserUpdateRow = {}

  if (userData.first_name !== undefined) updateData.first_name = userData.first_name
  if (userData.last_name !== undefined) updateData.last_name = userData.last_name
  if (userData.display_name !== undefined) updateData.display_name = userData.display_name
  if (userData.email !== undefined) updateData.email = userData.email
  if (userData.cargo_rol !== undefined) updateData.cargo_rol = userData.cargo_rol
  if (userData.profile_picture_url !== undefined) updateData.profile_picture_url = userData.profile_picture_url
  if (userData.bio !== undefined) updateData.bio = userData.bio
  if (userData.location !== undefined) updateData.location = userData.location
  if (userData.phone !== undefined) updateData.phone = userData.phone
  if (userData.date_of_birth !== undefined || userData.gender !== undefined) {
    assertValidBusinessUserDemographics(userData)
  }
  if (userData.date_of_birth !== undefined) {
    updateData.date_of_birth = normalizeDateOfBirthForStorage(userData.date_of_birth)
  }
  if (userData.gender !== undefined) {
    updateData.gender = normalizeGenderForStorage(userData.gender)
  }

  return updateData
}

export function buildOrganizationUserUpdateData(
  userData: UpdateBusinessUserRequest,
): OrganizationUserUpdateRow {
  const updateData: OrganizationUserUpdateRow = {}

  if (userData.org_role !== undefined) {
    updateData.role = normalizeOrganizationRole(userData.org_role)
  }
  if (userData.job_title !== undefined) updateData.job_title = userData.job_title
  if (userData.org_status !== undefined) {
    updateData.status = normalizeOrganizationStatus(userData.org_status)
  }

  return updateData
}
