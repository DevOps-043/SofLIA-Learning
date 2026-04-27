'use client'

import { motion } from 'framer-motion'
import { Users, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AdminButton, AdminPageShell, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

export function AdminCommunitiesLoadingState() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  return (
    <AdminPageShell maxWidth="content">
      <div className="space-y-7">
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-transparent" style={{ borderBottomColor: theme.action }} />
            <p className="text-sm" style={{ color: theme.textMuted }}>{t('communities.page.loading')}</p>
          </div>
        </div>
      </div>
    </AdminPageShell>
  )
}

interface AdminCommunitiesErrorStateProps {
  error: string
  onRetry: () => void
}

export function AdminCommunitiesErrorState({ error, onRetry }: AdminCommunitiesErrorStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  return (
    <AdminPageShell maxWidth="content">
      <div className="flex min-h-[360px] items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <AdminSurface className="max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.dangerSurface, color: theme.danger }}>
              <Zap className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold" style={{ color: theme.text }}>{t('communities.page.errorTitle')}</h3>
            <p className="mb-6 text-sm" style={{ color: theme.textMuted }}>{error}</p>
            <AdminButton onClick={onRetry}>{t('actions.retry', { ns: 'common' })}</AdminButton>
          </AdminSurface>
        </motion.div>
      </div>
    </AdminPageShell>
  )
}

interface AdminCommunitiesEmptyStateProps {
  onCreate: () => void
}

export function AdminCommunitiesEmptyState({ onCreate }: AdminCommunitiesEmptyStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AdminSurface className="border-dashed p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.actionSurface, color: theme.action }}>
          <Users className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-bold" style={{ color: theme.text }}>{t('communities.page.emptyTitle')}</h3>
        <p className="mb-6 text-sm" style={{ color: theme.textMuted }}>{t('communities.page.emptyDescription')}</p>
        <AdminButton onClick={onCreate}>{t('communities.page.create')}</AdminButton>
      </AdminSurface>
    </motion.div>
  )
}
