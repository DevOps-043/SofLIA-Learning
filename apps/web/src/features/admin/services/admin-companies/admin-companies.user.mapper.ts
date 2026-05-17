import type { AdminCompanyUserProfile } from '../../types/admin-companies.types'
import type { OrganizationUserProfileRow } from './admin-companies.mapper.types'

export function mapOrganizationUserProfile(
  user: OrganizationUserProfileRow | null | undefined,
): AdminCompanyUserProfile | undefined {
  if (!user) {
    return undefined
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    display_name: user.display_name,
    profile_picture_url: user.profile_picture_url,
  }
}
