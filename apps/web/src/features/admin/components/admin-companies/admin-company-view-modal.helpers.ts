import type { AdminCompanyMember } from '../../types/admin-companies.types'

export function getMemberDisplayName(member: AdminCompanyMember, fallback: string) {
  const user = member.user
  if (!user) return fallback
  if (user.display_name) return user.display_name
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
  if (user.first_name) return user.first_name
  if (user.username) return user.username
  return user.email.split('@')[0] || fallback
}
