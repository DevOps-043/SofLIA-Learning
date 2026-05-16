'use client'

import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

export function AdminCompaniesEmptyState({
  themeColors,
}: {
  themeColors: AdminCompaniesThemeColors
}) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border p-12 text-center shadow-sm" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.borderColor }}>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border" style={{ backgroundColor: themeColors.inputBg, borderColor: themeColors.borderColor, color: theme.primaryColor }}>
        <Building2 className="h-9 w-9" />
      </div>
      <p className="mb-2 text-lg font-extrabold" style={{ color: themeColors.textPrimary }}>{t('companies.empty.title')}</p>
      <p className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>{t('companies.empty.description')}</p>
    </motion.div>
  )
}
