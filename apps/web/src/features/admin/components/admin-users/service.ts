import {
  Briefcase,
  CheckCircle,
  Clock,
  GraduationCap,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react'
import type { AdminUser } from '../../services/adminUsers.service'
import type { AdminRoleConfig, AdminStatusConfig, AdminTheme, AdminUserDisplayConfig } from './types'
export { formatAdminUserDate } from './admin-user-formatters'
export { getAdminRemovedStatusConfig } from './admin-user-status'

export function getAdminUserDisplayConfig(user: AdminUser): AdminUserDisplayConfig {
  const displayName =
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username

  return {
    displayName,
    email: user.email ?? '',
    role: user.platform_role || 'Usuario',
  }
}

export function getAdminRoleConfig(
  role: string,
  theme: AdminTheme,
  labels: Record<string, string>,
): AdminRoleConfig {
  switch (role) {
    case 'Administrador':
      return {
        label: labels.Administrador,
        text: theme.roleColors.admin.text,
        bg: theme.roleColors.admin.bg,
        border: `color-mix(in srgb, ${theme.roleColors.admin.text} 14.1%, transparent)`,
        icon: ShieldCheck,
      }
    case 'Instructor':
      return {
        label: labels.Instructor,
        text: theme.warningColor,
        bg: `color-mix(in srgb, ${theme.warningColor} 7.8%, transparent)`,
        border: `color-mix(in srgb, ${theme.warningColor} 14.9%, transparent)`,
        icon: GraduationCap,
      }
    case 'Business':
      return {
        label: labels.Business,
        text: theme.secondaryColor,
        bg: `color-mix(in srgb, ${theme.secondaryColor} 7.8%, transparent)`,
        border: `color-mix(in srgb, ${theme.secondaryColor} 14.9%, transparent)`,
        icon: Briefcase,
      }
    case 'Usuario':
      return {
        label: labels.Usuario,
        text: theme.successColor,
        bg: `color-mix(in srgb, ${theme.successColor} 7.8%, transparent)`,
        border: `color-mix(in srgb, ${theme.successColor} 14.9%, transparent)`,
        icon: UserCircle,
      }
    default:
      return {
        label: role || labels.Usuario,
        text: theme.mutedTextColor,
        bg: theme.hoverBg,
        border: theme.borderColor,
        icon: Users,
      }
  }
}

export function getAdminStatusConfig(
  isVerified: boolean,
  theme: AdminTheme,
  labels: { verified: string; pending: string },
): AdminStatusConfig {
  if (isVerified) {
    return {
      label: labels.verified,
      color: theme.successColor,
      bg: `color-mix(in srgb, ${theme.successColor} 7.8%, transparent)`,
      border: `color-mix(in srgb, ${theme.successColor} 14.9%, transparent)`,
      icon: CheckCircle,
    }
  }

  return {
    label: labels.pending,
    color: theme.warningColor,
    bg: `color-mix(in srgb, ${theme.warningColor} 7.8%, transparent)`,
    border: `color-mix(in srgb, ${theme.warningColor} 14.9%, transparent)`,
    icon: Clock,
  }
}
