'use client'

import { AlertCircle, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminReportesPageStateProps {
  type: 'loading' | 'error'
  message?: string
  onRetry?: () => void
}

export function AdminReportesPageState({ type, message, onRetry }: AdminReportesPageStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const Icon = type === 'loading' ? LoaderCircle : AlertCircle
  const text = message?.includes('_') ? t(`reportesPage.errors.${message}`, { defaultValue: message }) : message

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6" style={{ backgroundColor: theme.panelBg }}>
      <div className="flex max-w-md flex-col items-center gap-4 rounded-[24px] border p-8 text-center" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <Icon className={`h-8 w-8 ${type === 'loading' ? 'animate-spin' : ''}`} style={{ color: type === 'loading' ? theme.primaryColor : theme.dangerColor }} />
        <p className="text-sm" style={{ color: theme.subtextColor }}>{text ?? t(type === 'loading' ? 'reportesPage.loading' : 'reportesPage.error')}</p>
        {type === 'error' && onRetry ? <button type="button" onClick={onRetry} className="rounded-2xl px-4 py-2 text-sm font-semibold" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}>{t('reportesPage.retry')}</button> : null}
      </div>
    </div>
  )
}
