'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface UserStatsErrorStateProps {
  message: string
}

export function UserStatsErrorState({ message }: UserStatsErrorStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-[24px] border px-6 text-center" style={{ backgroundColor: theme.cardBg, borderColor: theme.dangerColor }}>
      <AlertCircle className="h-8 w-8" style={{ color: theme.dangerColor }} />
      <div className="space-y-1">
        <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
          {t('userStats.errorTitle')}
        </p>
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {message}
        </p>
      </div>
    </div>
  )
}
