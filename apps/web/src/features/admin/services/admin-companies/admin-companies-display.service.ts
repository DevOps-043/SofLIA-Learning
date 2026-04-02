import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
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
      bgColor: `${adminCompaniesColors.pending}20`,
      icon: ArrowPathIcon,
    }
  }

  if (!company.is_active) {
    return {
      label: 'Pausada',
      color: adminCompaniesColors.warning,
      bgColor: `${adminCompaniesColors.warning}20`,
      icon: PauseCircleIcon,
    }
  }

  if (company.subscription_status?.toLowerCase() === 'trial') {
    return {
      label: 'Trial',
      color: adminCompaniesColors.purple,
      bgColor: `${adminCompaniesColors.purple}20`,
      icon: BoltIcon,
    }
  }

  if (company.subscription_status?.toLowerCase() === 'expired') {
    return {
      label: 'Expirada',
      color: adminCompaniesColors.error,
      bgColor: `${adminCompaniesColors.error}20`,
      icon: ExclamationTriangleIcon,
    }
  }

  return {
    label: 'Activa',
    color: adminCompaniesColors.success,
    bgColor: `${adminCompaniesColors.success}20`,
    icon: CheckCircleIcon,
  }
}

export function getCompanyUsagePercent(company: Pick<AdminCompany, 'active_users' | 'max_users'>): number {
  if (!company.max_users) {
    return 0
  }

  return Math.min(100, Math.round((company.active_users / company.max_users) * 100))
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
