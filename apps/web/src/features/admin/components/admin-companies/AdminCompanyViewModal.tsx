'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany } from '../../types/admin-companies.types'
import { getAdminCompanyPlanColor, getAdminCompanyPlanKey, getAdminCompanyStatusDisplayConfig, getCompanyUsagePercent, type AdminCompaniesThemeColors } from '../../services/admin-companies'
import { AdminCompanyAdminsSection } from './AdminCompanyAdminsSection'
import { AdminCompanyContactSection } from './AdminCompanyContactSection'
import { AdminCompanyUsersSection } from './AdminCompanyUsersSection'
import { AdminCompanyViewModalHeader } from './AdminCompanyViewModalHeader'

interface AdminCompanyViewModalProps {
  company: AdminCompany
  onClose: () => void
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyViewModal({ company, onClose, themeColors }: AdminCompanyViewModalProps) {
  const router = useRouter()
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const status = getAdminCompanyStatusDisplayConfig(company, theme)
  const normalizedPlan = getAdminCompanyPlanKey(company.subscription_plan)
  const planColor = getAdminCompanyPlanColor(company.subscription_plan, theme)
  const owner = company.members?.find((member) => member.role === 'owner')
  const admins = company.members?.filter((member) => member.role === 'admin') || []
  const adminMembers = owner ? [owner, ...admins] : admins
  const logoUrl = company.brand_logo_url || company.logo_url
  const usagePercent = getCompanyUsagePercent(company)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto p-4" style={{ backgroundColor: theme.overlayBg }} onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} onClick={(event) => event.stopPropagation()} className="relative my-8 w-full max-w-3xl overflow-hidden rounded-[28px] border shadow-2xl" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.borderColor }}>
        <AdminCompanyViewModalHeader company={company} logoUrl={logoUrl} status={status} planColor={planColor} normalizedPlan={normalizedPlan} themeColors={themeColors} onClose={onClose} />
        <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1fr_0.9fr]">
          <AdminCompanyAdminsSection members={adminMembers} themeColors={themeColors} />
          <AdminCompanyContactSection company={company} themeColors={themeColors} />
          <AdminCompanyUsersSection company={company} usagePercent={usagePercent} themeColors={themeColors} />
          <button type="button" onClick={() => { onClose(); router.push(`/admin/companies/${company.id}/edit`) }} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold lg:col-span-2" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor, boxShadow: `0 12px 28px color-mix(in srgb, ${theme.primaryColor} 14.1%, transparent)` }}>
            <Pencil className="h-4 w-4" />
            {t('companies.modal.editDetails')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
