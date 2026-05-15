'use client'

import { motion } from 'framer-motion'
import { BookOpen, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminWorkshopsEmptyStateProps {
  hasActiveFilters: boolean
}

export function AdminWorkshopsEmptyState({
  hasActiveFilters,
}: AdminWorkshopsEmptyStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const Icon = hasActiveFilters ? SlidersHorizontal : BookOpen

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border px-6 py-14 text-center shadow-sm"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border"
        style={{
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
          color: theme.primaryColor,
        }}
      >
        <Icon className="h-9 w-9" />
      </div>
      <h3 className="text-xl font-extrabold" style={{ color: theme.textColor }}>
        {t('workshops.empty.title')}
      </h3>
      <p className="mt-2 max-w-md text-sm font-medium" style={{ color: theme.subtextColor }}>
        {hasActiveFilters
          ? t('workshops.empty.filters')
          : t('workshops.empty.noWorkshops')}
      </p>
    </motion.div>
  )
}
