import type { TFunction } from 'i18next'
import type { LucideIcon } from 'lucide-react'
import type { AdminUser } from '../../services/adminUsers.service'
import type { AdminPanelThemeTokens } from '../../hooks/useAdminPanelTheme'
import { ADMIN_USER_PLATFORM_ROLES } from '../../services/admin-users/types'

export type AdminUsersViewMode = 'cards' | 'list'

// El filtro de la UI es la lista de roles del servidor mas la opcion "todos":
// asi un rol nuevo aparece en el selector sin tocar dos sitios.
export const ADMIN_ROLE_FILTERS = ['all', ...ADMIN_USER_PLATFORM_ROLES] as const

export type AdminRoleFilter = (typeof ADMIN_ROLE_FILTERS)[number]

export interface AdminRoleConfig {
  label: string
  text: string
  bg: string
  border: string
  icon: LucideIcon
}

export interface AdminStatusConfig {
  label: string
  color: string
  bg: string
  border: string
  icon: LucideIcon
}

export interface AdminUserDisplayConfig {
  displayName: string
  email: string
  role: string
}

export interface AdminUserCardProps {
  user: AdminUser
  index: number
  locale: string
  onEdit: () => void
  onDelete: () => void
  onViewStats: () => void
  t: TFunction<'admin'>
  tc: TFunction<'common'>
}

export interface AdminUserListRowProps extends AdminUserCardProps {}

export type AdminTheme = AdminPanelThemeTokens
