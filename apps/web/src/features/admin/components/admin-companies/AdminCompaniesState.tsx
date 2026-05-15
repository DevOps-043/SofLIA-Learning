'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Building2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompaniesLoadingStateProps {
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesLoadingState({ themeColors }: AdminCompaniesLoadingStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: themeColors.background }}>
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div
          className="flex w-full max-w-sm flex-col items-center rounded-[28px] border p-8 text-center shadow-sm"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderColor,
          }}
        >
          <div
            className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-transparent"
            style={{
              borderTopColor: theme.primaryColor,
              borderRightColor: `${theme.primaryColor}40`,
            }}
          />
          <p className="text-sm font-bold" style={{ color: themeColors.textPrimary }}>
            {t('companies.page.loading')}
          </p>
        </div>
      </div>
    </div>
  )
}

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
    <div
      className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: themeColors.background }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[24px] border p-8 text-center shadow-sm"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: `${theme.dangerColor}30`,
        }}
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: `${theme.dangerColor}12`,
            borderColor: `${theme.dangerColor}24`,
            color: theme.dangerColor,
          }}
        >
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-xl font-extrabold" style={{ color: themeColors.textPrimary }}>
          {t('companies.page.errorLoading')}
        </h2>
        <p className="mb-6 text-sm font-medium" style={{ color: themeColors.textSecondary }}>
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto flex h-11 items-center gap-2 rounded-2xl px-6 text-sm font-bold"
          style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
        >
          <RefreshCw className="h-4 w-4" />
          {t('companies.actions.retry')}
        </button>
      </motion.div>
    </div>
  )
}

interface AdminCompaniesEmptyStateProps {
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesEmptyState({ themeColors }: AdminCompaniesEmptyStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-full flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border p-12 text-center shadow-sm"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderColor,
      }}
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border"
        style={{
          backgroundColor: themeColors.inputBg,
          borderColor: themeColors.borderColor,
          color: theme.primaryColor,
        }}
      >
        <Building2 className="h-9 w-9" />
      </div>
      <p className="mb-2 text-lg font-extrabold" style={{ color: themeColors.textPrimary }}>
        {t('companies.empty.title')}
      </p>
      <p className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>
        {t('companies.empty.description')}
      </p>
    </motion.div>
  )
}
