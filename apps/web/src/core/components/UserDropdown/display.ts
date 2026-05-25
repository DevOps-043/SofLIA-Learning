export interface DropdownUserLike {
  cargo_rol?: string
  display_name?: string
  profile_picture_url?: string
}

export interface DropdownUserProfileLike {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  profile_picture_url?: string | null
}

export function getUserDisplayName(
  userProfile: DropdownUserProfileLike | null | undefined,
  user: DropdownUserLike | null | undefined,
  fallback: string,
) {
  if (userProfile?.first_name && userProfile?.last_name) {
    return `${userProfile.first_name} ${userProfile.last_name}`
  }
  return userProfile?.display_name || user?.display_name || userProfile?.first_name || fallback
}

export function getUserInitials(displayName: string) {
  const parts = displayName.split(' ').filter((segment): segment is string => Boolean(segment))
  if (parts.length === 0) return 'U'
  return parts.map((part) => part.charAt(0)).join('').toUpperCase().slice(0, 2)
}

export function getUserRoleLabel({
  isAdmin,
  isInstructor,
  isOrgAdmin,
  orgAdminLabel,
  user,
}: {
  isAdmin: boolean
  isInstructor: boolean
  isOrgAdmin: boolean
  orgAdminLabel: string
  user: DropdownUserLike | null | undefined
}) {
  if (isAdmin) return 'Superadmin'
  if (isInstructor) return 'Instructor'
  if (isOrgAdmin) return orgAdminLabel
  return user?.cargo_rol || ''
}
