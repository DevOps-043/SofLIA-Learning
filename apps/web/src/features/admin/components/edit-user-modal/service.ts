import type { AdminUser } from '../../services/adminUsers.service'
import type { EditUserFormData, EditUserTabConfig } from './types'

type AdminUserWithPoints = AdminUser & {
  points?: number | null
}

export function createEditUserFormData(
  user?: AdminUser | null,
): EditUserFormData {
  const extendedUser = user as AdminUserWithPoints | null | undefined

  return {
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    display_name: user?.display_name || '',
    cargo_rol: user?.cargo_rol || 'Usuario',
    type_rol: user?.type_rol || '',
    email_verified: user?.email_verified || false,
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    bio: user?.bio || '',
    location: user?.location || '',
    profile_picture_url: user?.profile_picture_url || '',
    country_code: user?.country_code || '',
    points: Number(extendedUser?.points) || 0,
  }
}

export function updateEditUserField(
  current: EditUserFormData,
  name: keyof EditUserFormData,
  value: string | boolean,
  inputType?: string,
): EditUserFormData {
  if (name === 'email_verified') {
    return { ...current, email_verified: Boolean(value) }
  }

  if (name === 'points') {
    return { ...current, points: Number(value) || 0 }
  }

  return {
    ...current,
    [name]:
      inputType === 'checkbox'
        ? Boolean(value)
        : typeof value === 'string'
          ? value
          : String(value),
  }
}

export function getEditUserDisplayName(user: AdminUser): string {
  return (
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username
  )
}

export const EDIT_USER_TABS: EditUserTabConfig[] = [
  { id: 'personal', label: 'Personal', iconName: 'user' },
  { id: 'account', label: 'Cuenta', iconName: 'shield' },
]
