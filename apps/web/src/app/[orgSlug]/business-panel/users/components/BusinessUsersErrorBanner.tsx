'use client'

import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BusinessUsersTheme } from './users-page.types'

interface BusinessUsersErrorBannerProps {
  error: unknown
  theme: BusinessUsersTheme
}

export function BusinessUsersErrorBanner({
  error,
  theme,
}: BusinessUsersErrorBannerProps) {
  const { t } = useTranslation('business')

  if (!error) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-4"
      style={{
        backgroundColor: `${theme.warningColor}10`,
        borderColor: `${theme.warningColor}25`,
      }}
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5" style={{ color: theme.warningColor }} />
        <p className="text-sm" style={{ color: theme.warningColor }}>
          {t('users.error.loadFailed')}
        </p>
      </div>
    </motion.div>
  )
}
