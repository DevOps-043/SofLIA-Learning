import type { TFunction } from 'i18next'
import type { LucideIcon } from 'lucide-react'
import type { AdminUser } from '../../services/adminUsers.service'
import type { AdminPanelThemeTokens } from '../../hooks/useAdminPanelTheme'

export type AdminUsersViewMode = 'cards' | 'list'

export const ADMIN_ROLE_FILTERS = ['all', 'Usuario', 'Instructor', 'Administrador', 'Business'] as const

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
