'use client'

import { PremiumLoadingScreen } from '@/core/components/PremiumLoadingScreen/PremiumLoadingScreen'
import { useTranslation } from 'react-i18next'
import type { ProfileColorPalette } from '../../types/profile.types'

interface ProfileLoadingStateProps {
  colors: ProfileColorPalette
}

export function ProfileLoadingState({ colors }: ProfileLoadingStateProps) {
  const { t } = useTranslation('common')
  return (
    <PremiumLoadingScreen
      label={t('profile.loading')}
      palette={{
        accent: colors.accent,
        background: colors.bgPrimary,
        border: colors.border,
        muted: colors.textSecondary,
        onPrimary: colors.onPrimary,
        primary: colors.primary,
        surface: colors.bgSecondary,
        text: colors.text,
      }}
    />
  )
}

interface ProfileErrorStateProps {
  colors: ProfileColorPalette
  retryLoad: () => void
  goToLogin: () => void
}

export function ProfileErrorState({ colors, retryLoad, goToLogin }: ProfileErrorStateProps) {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: colors.bgPrimary }}>
      <p style={{ color: colors.textSecondary }}>{t('profile.error.title')}</p>
      <p className="text-sm max-w-md text-center" style={{ color: colors.textSecondary }}>
        {t('profile.error.description')}
      </p>
      <div className="flex gap-3 mt-4">
        <button onClick={retryLoad} className="px-4 py-2 rounded-lg bg-white/10 transition-colors" style={{ color: colors.text }}>
          {t('profile.error.retry')}
        </button>
        <button onClick={goToLogin} className="px-4 py-2 rounded-lg font-medium transition-colors" style={{ backgroundColor: colors.primary, color: 'var(--color-bg-light)' }}>
          {t('profile.error.login')}
        </button>
      </div>
    </div>
  )
}
