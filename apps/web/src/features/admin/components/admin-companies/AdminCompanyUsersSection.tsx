'use client'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany } from '../../types/admin-companies.types'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'
import { AdminCompanyMetric } from './AdminCompanyMetric'

interface AdminCompanyUsersSectionProps {
  company: AdminCompany
  usagePercent: number
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyUsersSection(props: AdminCompanyUsersSectionProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <section className="rounded-[22px] border p-4 lg:col-span-2" style={{ backgroundColor: props.themeColors.inputBg, borderColor: props.themeColors.borderColor }}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primaryColor }}>{t('companies.modal.usersTitle', { count: props.company.total_users })}</h3>
        <span className="text-xs font-bold" style={{ color: props.themeColors.textSecondary }}>{props.usagePercent}%</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AdminCompanyMetric label={t('companies.card.activeUsers')} value={props.company.active_users} color={theme.successColor} themeColors={{ ...props.themeColors, inputBg: theme.cardBg }} />
        <AdminCompanyMetric label={t('companies.modal.invitedUsers')} value={props.company.invited_users} color={theme.warningColor} themeColors={{ ...props.themeColors, inputBg: theme.cardBg }} />
        <AdminCompanyMetric label={t('companies.modal.suspendedUsers')} value={props.company.suspended_users} color={theme.dangerColor} themeColors={{ ...props.themeColors, inputBg: theme.cardBg }} />
        <AdminCompanyMetric label={t('companies.modal.maxUsers')} value={props.company.max_users || t('companies.card.unlimited')} color={theme.primaryColor} themeColors={{ ...props.themeColors, inputBg: theme.cardBg }} />
      </div>
    </section>
  )
}
