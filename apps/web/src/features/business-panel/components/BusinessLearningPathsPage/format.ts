import type { BusinessUser } from '../../services/businessUsers.service'

export function getUserDisplayName(user: BusinessUser | null | undefined) {
  if (!user) return ''
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return user.display_name || fullName || user.email
}
