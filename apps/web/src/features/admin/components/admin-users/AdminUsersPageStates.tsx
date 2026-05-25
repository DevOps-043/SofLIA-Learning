'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export function AdminUsersLoadingState({ t }: { t: TFunction<'admin'> }) {
  const theme = useAdminPanelTheme()
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.panelBg }}>
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="flex w-full max-w-sm flex-col items-center rounded-[28px] border p-8 text-center shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
          <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-transparent" style={{ borderTopColor: theme.primaryColor, borderRightColor: `color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent)` }} />
          <p className="text-sm font-bold" style={{ color: theme.textColor }}>{t('users.page.loading')}</p>
        </div>
      </div>
    </div>
  )
}

interface AdminUsersErrorStateProps {
  error: string
  isRefreshing: boolean
  onRetry: () => void
  t: TFunction<'admin'>
}

export function AdminUsersErrorState({
  error,
  isRefreshing,
  onRetry,
  t,
}: AdminUsersErrorStateProps) {
  const theme = useAdminPanelTheme()
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.panelBg }}>
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border p-6 shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: `color-mix(in srgb, ${theme.dangerColor} 18.8%, transparent)` }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border" style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 14.1%, transparent)`, color: theme.dangerColor }}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-extrabold" style={{ color: theme.textColor }}>{t('users.page.errorLoading')}</h3>
              <p className="mt-2 text-sm font-medium" style={{ color: theme.subtextColor }}>{error}</p>
              <button type="button" onClick={onRetry} className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-bold" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}>
                <RefreshCw className={`h-4 w-4${isRefreshing ? ' animate-spin' : ''}`} />
                {t('users.page.retry')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
