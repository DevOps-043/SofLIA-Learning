'use client'

import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

export function UserProgressEmptyState() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg, color: theme.mutedTextColor }}><BookOpen className="h-6 w-6" /></span>
      <p className="text-sm" style={{ color: theme.subtextColor }}>{t('userStats.progressModal.noCourses')}</p>
    </div>
  )
}
