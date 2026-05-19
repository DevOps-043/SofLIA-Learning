'use client'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export function AdminWorkshopsLoadingState() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.panelBg }}>
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div
          className="flex w-full max-w-sm flex-col items-center rounded-[28px] border p-8 text-center shadow-sm"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <div
            className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-transparent"
            style={{
              borderTopColor: theme.primaryColor,
              borderRightColor: `color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent)`,
            }}
          />
          <p className="text-sm font-bold" style={{ color: theme.textColor }}>
            {t('workshops.page.loading')}
          </p>
        </div>
      </div>
    </div>
  )
}
