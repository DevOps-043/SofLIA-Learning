'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany } from '../../types/admin-companies.types'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'
import { AdminCompanyMetric } from './AdminCompanyMetric'

interface AdminCompanyCardUsageProps {
  company: AdminCompany
  usagePercent: number
  usageColor: string
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyCardUsage(props: AdminCompanyCardUsageProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <AdminCompanyMetric label={t('companies.card.activeUsers')} value={props.company.active_users} color={props.themeColors.textPrimary} themeColors={props.themeColors} />
        <AdminCompanyMetric label={t('companies.card.totalUsers')} value={props.company.total_users} color={props.themeColors.textPrimary} themeColors={props.themeColors} />
        <AdminCompanyMetric label={t('companies.card.usage')} value={`${props.usagePercent}%`} color={props.usageColor} themeColors={props.themeColors} />
      </div>
      <div className="mb-6">
        <div className="mb-2 flex justify-between gap-3 text-xs font-bold" style={{ color: props.themeColors.textSecondary }}>
          <span>{t('companies.card.licenseUsage')}</span>
          <span>{props.company.active_users} / {props.company.max_users || t('companies.card.unlimited')}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
          <motion.div className="h-full rounded-full" style={{ backgroundColor: props.usageColor }} initial={{ width: 0 }} animate={{ width: `${props.usagePercent}%` }} transition={{ duration: 0.8, delay: 0.15 }} />
        </div>
      </div>
    </>
  )
}
