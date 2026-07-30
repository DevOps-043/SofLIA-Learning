import { PremiumLoadingScreen } from '@/core/components/PremiumLoadingScreen/PremiumLoadingScreen'

import type { BusinessUserDashboardColors } from '../types'

interface BusinessUserDashboardLoadingProps {
  orgColors: BusinessUserDashboardColors
  title: string
  subtitle: string
}

export function BusinessUserDashboardLoading({
  orgColors,
  title,
  subtitle,
}: BusinessUserDashboardLoadingProps) {
  return (
    <PremiumLoadingScreen
      description={subtitle}
      label={title}
      palette={{
        accent: orgColors.accent,
        background: orgColors.sidebarBg,
        border: orgColors.border,
        muted: orgColors.textSecondary,
        onPrimary: orgColors.onPrimary,
        primary: orgColors.primary,
        surface: orgColors.cardBg,
        text: orgColors.text,
      }}
    />
  )
}
