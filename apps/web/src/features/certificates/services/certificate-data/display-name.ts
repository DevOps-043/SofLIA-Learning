import type { UserProfileRow } from './types'

export function getDisplayName(user: UserProfileRow | null | undefined, fallback: string): string {
  if (!user) {
    return fallback
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return user.display_name || fullName || user.username || fallback
}
