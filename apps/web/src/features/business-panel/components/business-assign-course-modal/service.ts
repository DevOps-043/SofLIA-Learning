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
    return (
      displayName.includes(normalizedSearchTerm) ||
      user.email.toLowerCase().includes(normalizedSearchTerm)
    )
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
  if (selectableUserIds.length === 0) {
    return false
  }

  return selectableUserIds.every((userId) => selectedUserIds.has(userId))
}

export function getSelectedUsers(
  users: BusinessUser[],
  selectedUserIds: Set<string>,
): BusinessUser[] {
  return users.filter((user) => selectedUserIds.has(user.id))
}

export function getDateInputValue(dateIso?: string): string {
  if (!dateIso) {
    return ''
  }

  const parsedDate = new Date(dateIso)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const year = parsedDate.getFullYear()
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsedDate.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toEndOfDayIso(dateValue: string): string {
  const selectedDate = new Date(`${dateValue}T23:59:59.999`)
  return selectedDate.toISOString()
}

export function normalizeLiaSuggestedDate(dateValue?: string | null): string | null {
  if (!dateValue) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return toEndOfDayIso(dateValue)
  }

  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString()
}

export function buildBusinessAssignCoursePayload(params: {
  selectedUserIds: Set<string>
  dueDate: string
}): {
  user_ids: string[]
  due_date: string | null
  start_date: null
  approach: null
  message: null
} {
  return {
    user_ids: Array.from(params.selectedUserIds),
    due_date: params.dueDate || null,
    start_date: null,
    approach: null,
    message: null,
  }
}
