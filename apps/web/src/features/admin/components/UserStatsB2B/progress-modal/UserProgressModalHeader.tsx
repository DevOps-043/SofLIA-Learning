'use client'

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface UserProgressModalHeaderProps {
  coursesCount: number
  onClose: () => void
}

export function UserProgressModalHeader({ coursesCount, onClose }: UserProgressModalHeaderProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <header className="flex items-start justify-between border-b px-6 py-5" style={{ borderColor: theme.borderColor }}>
      <div className="space-y-1"><h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('userStats.progressModal.title')}</h2><p className="text-sm" style={{ color: theme.subtextColor }}>{t('userStats.progressModal.enrolledCourses', { count: coursesCount })}</p></div>
      <button type="button" onClick={onClose} className="rounded-2xl border p-2" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}><X className="h-4 w-4" /></button>
    </header>
  )
}
