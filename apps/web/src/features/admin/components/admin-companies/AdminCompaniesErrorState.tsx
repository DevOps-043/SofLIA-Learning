'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompaniesErrorStateProps {
  error: string
  onRetry: () => void
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesErrorState({
  error,
  onRetry,
  themeColors,
}: AdminCompaniesErrorStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8" style={{ backgroundColor: themeColors.background }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-[24px] border p-8 text-center shadow-sm" style={{ backgroundColor: themeColors.cardBackground, borderColor: `color-mix(in srgb, ${theme.dangerColor} 18.8%, transparent)` }}>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 14.1%, transparent)`, color: theme.dangerColor }}>
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-xl font-extrabold" style={{ color: themeColors.textPrimary }}>{t('companies.page.errorLoading')}</h2>
        <p className="mb-6 text-sm font-medium" style={{ color: themeColors.textSecondary }}>{error}</p>
        <button type="button" onClick={onRetry} className="mx-auto flex h-11 items-center gap-2 rounded-2xl px-6 text-sm font-bold" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}>
          <RefreshCw className="h-4 w-4" />
          {t('companies.actions.retry')}
        </button>
      </motion.div>
    </div>
  )
}
