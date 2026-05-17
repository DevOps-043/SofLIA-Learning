'use client'

import { Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export function LiaAnalyticsInfoBanner() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <section className="rounded-[24px] border p-4" style={{ backgroundColor: theme.actionSurface, borderColor: theme.borderColor }}>
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.inputBg, color: theme.primaryColor }}><Lightbulb className="h-5 w-5" /></span>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold" style={{ color: theme.textColor }}>{t('liaAnalyticsPage.costInfo.title')}</h4>
          <p className="text-sm leading-6" style={{ color: theme.subtextColor }}>{t('liaAnalyticsPage.costInfo.description')}</p>
        </div>
      </div>
    </section>
  )
}
