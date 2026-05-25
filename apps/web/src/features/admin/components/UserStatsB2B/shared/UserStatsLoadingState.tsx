'use client'

import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

export function UserStatsLoadingState() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="flex h-72 flex-col items-center justify-center gap-4 rounded-[24px] border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <LoaderCircle className="h-8 w-8 animate-spin" style={{ color: theme.primaryColor }} />
      <p className="text-sm" style={{ color: theme.subtextColor }}>
        {t('userStats.loading')}
      </p>
    </div>
  )
}
