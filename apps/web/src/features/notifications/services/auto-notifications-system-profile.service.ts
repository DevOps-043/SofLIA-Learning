import { getFieldDisplayName } from './auto-notifications-system-fields'

const EXCLUDED_PROFILE_FIELDS = ['id', 'updated_at', 'created_at', 'last_login_at']

export interface ProfileUpdatedNotification {
  displayableChanges: string[]
  friendlyNames: string[]
  message: string
}

function buildChangesText(friendlyNames: string[]) {
  if (friendlyNames.length === 1) {
    return `Se actualizó: ${friendlyNames[0]}`
  }

  if (friendlyNames.length === 2) {
    return `Se actualizaron: ${friendlyNames[0]} y ${friendlyNames[1]}`
  }

  const fieldsBeforeLast = friendlyNames.slice(0, -1)
  const lastField = friendlyNames[friendlyNames.length - 1]
  return `Se actualizaron: ${fieldsBeforeLast.join(', ')} y ${lastField}`
}

export function buildProfileUpdatedNotification(
  changes: string[],
): ProfileUpdatedNotification | null {
  const displayableChanges = changes.filter(
    (field) => !EXCLUDED_PROFILE_FIELDS.includes(field),
  )

  if (displayableChanges.length === 0) {
    return null
  }

  const friendlyNames = displayableChanges.map((field) => getFieldDisplayName(field))

  return {
    displayableChanges,
    friendlyNames,
    message: buildChangesText(friendlyNames),
  }
}
