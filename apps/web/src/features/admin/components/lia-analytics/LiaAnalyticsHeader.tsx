'use client'

import { Cpu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface LiaAnalyticsHeaderProps {
  lastUpdated: Date | null
}

export function LiaAnalyticsHeader({ lastUpdated }: LiaAnalyticsHeaderProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <section className="rounded-[28px] border p-6 md:p-7" style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}>
      <div className="space-y-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: theme.inverseSubtextColor, borderColor: theme.inverseBorderColor, backgroundColor: theme.inverseSurface }}>
          <Cpu className="h-3.5 w-3.5" />
          {t('navigation.liaAnalytics')}
        </span>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold md:text-[2rem]" style={{ color: theme.inverseTextColor }}>{t('liaAnalyticsPage.title')}</h1>
          <p className="max-w-3xl text-sm md:text-base" style={{ color: theme.inverseSubtextColor }}>{t('liaAnalyticsPage.subtitle')}</p>
          {lastUpdated ? <p className="text-xs" style={{ color: theme.inverseMutedTextColor }}>{t('liaAnalyticsPage.lastUpdated', { time: lastUpdated.toLocaleTimeString() })}</p> : null}
        </div>
      </div>
    </section>
  )
}
