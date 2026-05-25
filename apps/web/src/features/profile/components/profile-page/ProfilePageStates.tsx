'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { ProfileColorPalette } from '../../types/profile.types'

interface ProfileLoadingStateProps {
  colors: ProfileColorPalette
}

export function ProfileLoadingState({ colors }: ProfileLoadingStateProps) {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bgPrimary }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid color-mix(in srgb, ${colors.accent} 18.8%, transparent)` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-1 rounded-full border-2 border-r-transparent border-b-transparent border-l-transparent"
            style={{ borderTopColor: colors.accent }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p style={{ color: colors.textSecondary }}>{t('profile.loading')}</p>
      </motion.div>
    </div>
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
