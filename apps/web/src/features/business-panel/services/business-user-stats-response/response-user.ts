import type { BusinessUserStatsApiResponse } from '../../types/business-user-stats.types'

interface BusinessUserProfile {
  display_name: string | null
  email: string | null
  first_name: string | null
  id: string
  last_name: string | null
  profile_picture_url: string | null
  username: string
}

export function buildUserResponse(
  user: BusinessUserProfile,
): BusinessUserStatsApiResponse['user'] {
  return {
    id: user.id,
    username: user.username,
    email: user.email ?? '',
    display_name:
      user.display_name ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      user.username,
    profile_picture_url: user.profile_picture_url,
  }
}
