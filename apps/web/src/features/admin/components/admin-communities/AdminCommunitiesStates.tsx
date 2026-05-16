'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Plus, RefreshCw, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export function AdminCommunitiesLoadingState() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div
      className="min-h-screen p-6 lg:p-8"
      style={{ backgroundColor: theme.panelBg }}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <div
          className="flex min-h-[260px] items-center justify-center rounded-3xl border"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <div className="text-center">
            <div
              className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
              style={{
                borderColor: theme.borderColor,
                borderTopColor: theme.primaryColor,
              }}
            />
            <p className="font-semibold" style={{ color: theme.textColor }}>
              {t('communities.page.loading')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AdminCommunitiesErrorStateProps {
  error: string
  onRetry: () => void
}

export function AdminCommunitiesErrorState({
  error,
  onRetry,
}: AdminCommunitiesErrorStateProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6 lg:p-8"
      style={{ backgroundColor: theme.panelBg }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md rounded-3xl border p-8 text-center shadow-xl"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${theme.dangerColor}14` }}
        >
          <AlertTriangle className="h-8 w-8" style={{ color: theme.dangerColor }} />
        </div>
        <h3 className="mb-2 text-xl font-bold" style={{ color: theme.textColor }}>
          {t('generic.errorLoading')}
        </h3>
        <p className="mb-6 text-sm" style={{ color: theme.subtextColor }}>
          {error}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold"
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.onPrimaryColor,
          }}
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          {tc('actions.retry')}
        </motion.button>
      </motion.div>
    </div>
  )
}

interface AdminCommunitiesEmptyStateProps {
  onCreate: () => void
}

export function AdminCommunitiesEmptyState({
  onCreate,
}: AdminCommunitiesEmptyStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border py-16 text-center"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ backgroundColor: theme.actionSurface }}
      >
        <Users className="h-10 w-10" style={{ color: theme.primaryColor }} />
      </div>
      <h3 className="mb-2 text-xl font-semibold" style={{ color: theme.textColor }}>
        {t('communities.empty.title')}
      </h3>
      <p className="mb-6 text-sm" style={{ color: theme.subtextColor }}>
        {t('communities.empty.description')}
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold"
        style={{
          backgroundColor: theme.primaryColor,
          color: theme.onPrimaryColor,
        }}
        type="button"
      >
        <Plus className="h-4 w-4" />
        {t('communities.page.createButton')}
      </motion.button>
    </motion.div>
  )
}
