'use client'

import { motion } from 'framer-motion'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany } from '../../types/admin-companies.types'
import { getAdminCompanyPlanColor, getAdminCompanyPlanKey, getAdminCompanyStatusDisplayConfig, getAdminCompanyUsageColor, getCompanyUsagePercent, type AdminCompaniesThemeColors } from '../../services/admin-companies'
import { AdminCompanyCardActions } from './AdminCompanyCardActions'
import { AdminCompanyCardHeader } from './AdminCompanyCardHeader'
import { AdminCompanyCardMeta } from './AdminCompanyCardMeta'
import { AdminCompanyCardUsage } from './AdminCompanyCardUsage'

interface AdminCompanyCardProps {
  company: AdminCompany
  onView: () => void
  onEdit: () => void
  onToggle: () => void
  onActivate?: () => void
  isUpdating: boolean
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyCard(props: AdminCompanyCardProps) {
  const theme = useAdminPanelTheme()
  const usagePercent = getCompanyUsagePercent(props.company)
  const status = getAdminCompanyStatusDisplayConfig(props.company, theme)
  const normalizedPlan = getAdminCompanyPlanKey(props.company.subscription_plan)
  const planColor = getAdminCompanyPlanColor(props.company.subscription_plan, theme)
  const logoUrl = props.company.brand_logo_url || props.company.logo_url
  const usageColor = getAdminCompanyUsageColor(usagePercent, theme)
  const shouldShowActivate = props.company.subscription_status?.toLowerCase() === 'pending' && !props.company.is_active && props.onActivate

  return (
    <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-[24px] border shadow-sm transition-shadow hover:shadow-xl" style={{ backgroundColor: props.themeColors.cardBackground, borderColor: props.themeColors.borderColor, boxShadow: theme.isDark ? '0 18px 40px -24px rgba(0,0,0,0.75)' : '0 16px 36px -28px rgba(15,23,42,0.18)' }}>
      <AdminCompanyCardHeader company={props.company} logoUrl={logoUrl} status={status} themeColors={props.themeColors} />
      <div className="flex flex-1 flex-col p-6">
        <AdminCompanyCardMeta normalizedPlan={normalizedPlan} planColor={planColor} subscriptionPlan={props.company.subscription_plan} contactEmail={props.company.contact_email} />
        <AdminCompanyCardUsage company={props.company} usagePercent={usagePercent} usageColor={usageColor} themeColors={props.themeColors} />
        <AdminCompanyCardActions isActive={props.company.is_active} isUpdating={props.isUpdating} shouldShowActivate={Boolean(shouldShowActivate)} onView={props.onView} onEdit={props.onEdit} onToggle={props.onToggle} onActivate={props.onActivate} />
      </div>
    </motion.article>
  )
}
