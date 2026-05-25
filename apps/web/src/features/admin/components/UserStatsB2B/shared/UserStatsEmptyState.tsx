'use client'

import { Database } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface UserStatsEmptyStateProps {
  message?: string
}

export function UserStatsEmptyState({ message }: UserStatsEmptyStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{ color: theme.mutedTextColor, borderColor: theme.borderColor, backgroundColor: theme.inputBg }}
      >
        <Database className="h-6 w-6" />
      </span>
      <p className="max-w-xs text-sm" style={{ color: theme.subtextColor }}>
        {message ?? t('userStats.emptyData')}
      </p>
    </div>
  )
}
