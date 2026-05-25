import type { BusinessUserStatsOrganizationUserRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

export function getUserProfile(organizationUser: BusinessUserStatsOrganizationUserRecord) {
  const user = unwrapRelation(organizationUser.users)

  if (!user) {
    throw new Error('No se encontr?? el perfil del usuario')
  }

  return user
}

export function buildUserResponse(user: ReturnType<typeof getUserProfile>) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name:
      user.display_name ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      user.username,
    profile_picture_url: user.profile_picture_url,
  }
}
