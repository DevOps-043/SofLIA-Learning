import type { AdminUser } from '../../../services/adminUsers.service'
import type { MasterPanelAccountFormData, MasterPanelProfileFormData } from './types'

/**
 * Funciones puras del formulario del Panel Maestro (port del antiguo
 * edit-user-modal/service.ts). Separadas del componente para poder testearlas.
 */

export function createProfileFormData(user?: AdminUser | null): MasterPanelProfileFormData {
  return {
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    display_name: user?.display_name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    bio: user?.bio || '',
    location: user?.location || '',
    profile_picture_url: user?.profile_picture_url || '',
    country_code: user?.country_code || '',
  }
}

export function createAccountFormData(user?: AdminUser | null): MasterPanelAccountFormData {
  return {
    platform_role: user?.platform_role || 'Usuario',
  }
}

export function updateProfileField(
  current: MasterPanelProfileFormData,
  name: keyof MasterPanelProfileFormData,
  value: string,
): MasterPanelProfileFormData {
  return { ...current, [name]: value }
}

export function getMasterPanelDisplayName(user: AdminUser): string {
  return (
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username
  )
}
