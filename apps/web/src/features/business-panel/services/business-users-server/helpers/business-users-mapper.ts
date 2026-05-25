import { calculateAgeFromDateOfBirth } from '../../../../../lib/schemas/user-demographics.schema'
import type { BusinessUser } from '../../businessUsers.service'
import type {
  BusinessUserProfileRow,
  OrganizationUserWithProfileRow,
} from '../types'
import {
  normalizeOrganizationRole,
  normalizeOrganizationStatus,
} from './business-users-normalizers'

function getJoinedProfile(
  value: OrganizationUserWithProfileRow['users'],
): BusinessUserProfileRow | null {
  return Array.isArray(value) ? value[0] ?? null : value
}

export function mapOrganizationUserRecord(
  record: OrganizationUserWithProfileRow,
): BusinessUser | null {
  const profile = getJoinedProfile(record.users)
  if (!profile) return null

  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    display_name: profile.display_name,
    cargo_rol: profile.cargo_rol ?? 'Business',
    job_title: record.job_title,
    organization_id: record.organization_id,
    email_verified: Boolean(profile.email_verified),
    profile_picture_url: profile.profile_picture_url,
    bio: profile.bio,
    location: profile.location,
    phone: profile.phone,
    date_of_birth: profile.date_of_birth,
    gender: profile.gender,
    age: calculateAgeFromDateOfBirth(profile.date_of_birth),
    points: 0,
    last_login_at: profile.last_login_at,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    org_role: normalizeOrganizationRole(record.role),
    org_status: normalizeOrganizationStatus(record.status),
    joined_at: record.joined_at ?? undefined,
  }
}
