import type { BusinessUser } from '../../services/businessUsers.service'

export function getBusinessAssignCourseDisplayName(user: BusinessUser): string {
  return (
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username
  )
}

export function filterBusinessAssignableUsers(
  users: BusinessUser[],
  searchTerm: string,
): BusinessUser[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  return users.filter((user) => {
    if (user.org_status && user.org_status !== 'active') {
      return false
    }

    if (!normalizedSearchTerm) {
      return true
    }

    const displayName = getBusinessAssignCourseDisplayName(user).toLowerCase()
    return displayName.includes(normalizedSearchTerm) || user.email.toLowerCase().includes(normalizedSearchTerm)
  })
}

export function toggleSelectedUserId(
  selectedUserIds: Set<string>,
  userId: string,
): Set<string> {
  const nextSelectedUserIds = new Set(selectedUserIds)

  if (nextSelectedUserIds.has(userId)) {
    nextSelectedUserIds.delete(userId)
    return nextSelectedUserIds
  }

  nextSelectedUserIds.add(userId)
  return nextSelectedUserIds
}

export function getSelectableUserIds(
  users: BusinessUser[],
  alreadyAssignedUserIds: Set<string>,
): string[] {
  return users
    .filter((user) => !alreadyAssignedUserIds.has(user.id))
    .map((user) => user.id)
}

export function areAllUsersSelected(
  selectableUserIds: string[],
  selectedUserIds: Set<string>,
): boolean {
  return selectableUserIds.length > 0 &&
    selectableUserIds.every((userId) => selectedUserIds.has(userId))
}

export function getSelectedUsers(
  users: BusinessUser[],
  selectedUserIds: Set<string>,
): BusinessUser[] {
  return users.filter((user) => selectedUserIds.has(user.id))
}
