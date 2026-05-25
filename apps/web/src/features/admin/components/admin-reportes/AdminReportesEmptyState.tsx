'use client'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { REPORTE_EMPTY_ICON } from './admin-reportes.options'

export function AdminReportesEmptyState() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const Icon = REPORTE_EMPTY_ICON

  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border" style={{ color: theme.mutedTextColor, backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
        <Icon className="h-7 w-7" />
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold" style={{ color: theme.textColor }}>{t('reportesPage.empty.title')}</h3>
        <p className="text-sm" style={{ color: theme.subtextColor }}>{t('reportesPage.empty.subtitle')}</p>
      </div>
    </div>
  )
}
