'use client'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

export function AdminCompaniesLoadingState({
  themeColors,
}: {
  themeColors: AdminCompaniesThemeColors
}) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: themeColors.background }}>
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="flex w-full max-w-sm flex-col items-center rounded-[28px] border p-8 text-center shadow-sm" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.borderColor }}>
          <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-transparent" style={{ borderTopColor: theme.primaryColor, borderRightColor: `${theme.primaryColor}40` }} />
          <p className="text-sm font-bold" style={{ color: themeColors.textPrimary }}>{t('companies.page.loading')}</p>
        </div>
      </div>
    </div>
  )
}
