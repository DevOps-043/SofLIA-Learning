'use client'

import { useTranslation } from 'react-i18next'
import { PanelDashboardHero } from '@/core/components/panel'

import type { AdminDashboardThemeColors } from './types'

interface AdminDashboardHeroProps {
  greeting: string
  themeColors: AdminDashboardThemeColors
  todayLabel: string
  userName: string
}

export function AdminDashboardHero({
  greeting,
  themeColors,
  todayLabel,
  userName,
}: AdminDashboardHeroProps) {
  const { t } = useTranslation('admin')

  return (
    <PanelDashboardHero
      eyebrow={t('dashboard.heroEyebrow')}
      greeting={greeting}
      imageAlt="Admin Dashboard Background"
      subtitle={t('dashboard.heroSubtitle')}
      theme={{
        accent: themeColors.accent,
        borderColor: themeColors.borderColor,
        cardBg: themeColors.cardBackground,
        inputBg: themeColors.inputBg,
        inverseSubtext: themeColors.inverseSubtext,
        inverseText: themeColors.inverseText,
        isLightMode: themeColors.isLightMode,
        primary: themeColors.primary,
        secondary: themeColors.secondary,
        subtext: themeColors.textSecondary,
        text: themeColors.textPrimary,
      }}
      todayLabel={todayLabel}
      userName={userName}
    />
  )
}
