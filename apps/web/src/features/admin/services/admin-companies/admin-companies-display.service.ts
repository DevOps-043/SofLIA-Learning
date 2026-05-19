import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import {
  BadgeCheck,
  Clock3,
  PauseCircle,
  ShieldAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ElementType } from 'react'

import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import type { AdminCompany, AdminCompanyUserProfile } from '../../types/admin-companies.types'

export const adminCompaniesColors = SOFLIA_ADMIN_COLORS

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  team: { label: 'Team', color: adminCompaniesColors.primary },
  business: { label: 'Business', color: adminCompaniesColors.accent },
  enterprise: { label: 'Enterprise', color: adminCompaniesColors.purple },
}

export interface AdminCompaniesThemeColors {
  background: string
  cardBackground: string
  textPrimary: string
  textSecondary: string
  borderColor: string
  inputBg: string
}

export interface AdminCompanyPlanInfo {
  label: string
  color: string
}

export interface AdminCompanyStatusInfo {
  label: string
  color: string
  bgColor: string
  icon: ElementType
}

export interface AdminCompanyDisplayTheme {
  primaryColor: string
  successColor: string
  warningColor: string
  dangerColor: string
  secondaryColor: string
  mutedTextColor: string
}

export type AdminCompanyStatusKey = 'active' | 'pending' | 'trial' | 'paused' | 'expired'

export interface AdminCompanyStatusDisplayConfig {
  key: AdminCompanyStatusKey
  color: string
  bg: string
  border: string
  icon: LucideIcon
}

export function formatCompanyPlan(plan?: string | null): AdminCompanyPlanInfo {
  if (!plan) {
    return { label: 'Sin plan', color: adminCompaniesColors.grayMedium }
  }

  const normalizedPlan = plan.toLowerCase()
  return PLAN_LABELS[normalizedPlan] || { label: plan, color: adminCompaniesColors.grayMedium }
}

export function getCompanyStatusInfo(company: AdminCompany): AdminCompanyStatusInfo {
  if (company.subscription_status?.toLowerCase() === 'pending' && !company.is_active) {
    return {
      label: 'Pendiente',
      color: adminCompaniesColors.pending,
      bgColor: `color-mix(in srgb, ${adminCompaniesColors.pending} 12.5%, transparent)`,
      icon: ArrowPathIcon,
    }
  }

  if (!company.is_active) {
    return {
      label: 'Pausada',
      color: adminCompaniesColors.warning,
      bgColor: `color-mix(in srgb, ${adminCompaniesColors.warning} 12.5%, transparent)`,
      icon: PauseCircleIcon,
    }
  }

  if (company.subscription_status?.toLowerCase() === 'trial') {
    return {
      label: 'Trial',
      color: adminCompaniesColors.purple,
      bgColor: `color-mix(in srgb, ${adminCompaniesColors.purple} 12.5%, transparent)`,
      icon: BoltIcon,
    }
  }

  if (company.subscription_status?.toLowerCase() === 'expired') {
    return {
      label: 'Expirada',
      color: adminCompaniesColors.error,
      bgColor: `color-mix(in srgb, ${adminCompaniesColors.error} 12.5%, transparent)`,
      icon: ExclamationTriangleIcon,
    }
  }

  return {
    label: 'Activa',
    color: adminCompaniesColors.success,
    bgColor: `color-mix(in srgb, ${adminCompaniesColors.success} 12.5%, transparent)`,
    icon: CheckCircleIcon,
  }
}

export function getCompanyUsagePercent(company: Pick<AdminCompany, 'active_users' | 'max_users'>): number {
  if (!company.max_users) {
    return 0
  }

  return Math.min(100, Math.round((company.active_users / company.max_users) * 100))
}

export function getAdminCompanyStatusKey(company: Pick<AdminCompany, 'is_active' | 'subscription_status'>): AdminCompanyStatusKey {
  const normalizedStatus = company.subscription_status?.toLowerCase()

  if (normalizedStatus === 'pending' && !company.is_active) {
    return 'pending'
  }

  if (!company.is_active) {
    return 'paused'
  }

  if (normalizedStatus === 'trial') {
    return 'trial'
  }

  if (normalizedStatus === 'expired') {
    return 'expired'
  }

  return 'active'
}

export function getAdminCompanyStatusDisplayConfig(
  company: Pick<AdminCompany, 'is_active' | 'subscription_status'>,
  theme: AdminCompanyDisplayTheme,
): AdminCompanyStatusDisplayConfig {
  const statusKey = getAdminCompanyStatusKey(company)

  switch (statusKey) {
    case 'pending':
      return {
        key: statusKey,
        color: theme.warningColor,
        bg: `color-mix(in srgb, ${theme.warningColor} 7.8%, transparent)`,
        border: `color-mix(in srgb, ${theme.warningColor} 14.9%, transparent)`,
        icon: Clock3,
      }
    case 'paused':
      return {
        key: statusKey,
        color: theme.dangerColor,
        bg: `color-mix(in srgb, ${theme.dangerColor} 7.8%, transparent)`,
        border: `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)`,
        icon: PauseCircle,
      }
    case 'trial':
      return {
        key: statusKey,
        color: theme.secondaryColor,
        bg: `color-mix(in srgb, ${theme.secondaryColor} 7.8%, transparent)`,
        border: `color-mix(in srgb, ${theme.secondaryColor} 14.9%, transparent)`,
        icon: Zap,
      }
    case 'expired':
      return {
        key: statusKey,
        color: theme.dangerColor,
        bg: `color-mix(in srgb, ${theme.dangerColor} 7.8%, transparent)`,
        border: `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)`,
        icon: ShieldAlert,
      }
    case 'active':
    default:
      return {
        key: 'active',
        color: theme.successColor,
        bg: `color-mix(in srgb, ${theme.successColor} 7.8%, transparent)`,
        border: `color-mix(in srgb, ${theme.successColor} 14.9%, transparent)`,
        icon: BadgeCheck,
      }
  }
}

export function getAdminCompanyPlanKey(plan?: string | null) {
  return plan?.toLowerCase() || 'none'
}

export function getAdminCompanyPlanColor(plan: string | null | undefined, theme: AdminCompanyDisplayTheme) {
  switch (getAdminCompanyPlanKey(plan)) {
    case 'team':
      return theme.primaryColor
    case 'business':
      return theme.successColor
    case 'enterprise':
      return theme.secondaryColor
    default:
      return theme.mutedTextColor
  }
}

export function getAdminCompanyUsageColor(usagePercent: number, theme: AdminCompanyDisplayTheme) {
  if (usagePercent > 90) {
    return theme.dangerColor
  }

  if (usagePercent > 70) {
    return theme.warningColor
  }

  return theme.primaryColor
}

export function getAdminCompanyUserDisplayName(user?: AdminCompanyUserProfile): string {
  if (!user) {
    return 'Usuario'
  }

  if (user.display_name) {
    return user.display_name
  }

  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }

  if (user.first_name) {
    return user.first_name
  }

  if (user.username) {
    return user.username
  }

  return user.email.split('@')[0]
}
