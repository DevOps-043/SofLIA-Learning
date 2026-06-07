interface DisplayUser {
  display_name?: string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

export function getUserDisplayName(user: DisplayUser | null | undefined) {
  if (!user) return ''
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return user.display_name || fullName || user.email || ''
}
