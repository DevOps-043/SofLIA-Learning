'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminWorkshopsErrorStateProps {
  error: string
  onRetry: () => void
}

export function AdminWorkshopsErrorState({
  error,
  onRetry,
}: AdminWorkshopsErrorStateProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.panelBg }}>
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border p-6 shadow-sm"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `${theme.dangerColor}30`,
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
              style={{
                backgroundColor: `${theme.dangerColor}12`,
                borderColor: `${theme.dangerColor}24`,
                color: theme.dangerColor,
              }}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-extrabold" style={{ color: theme.textColor }}>
                {t('workshops.errors.load')}
              </h3>
              <p className="mt-2 text-sm font-medium" style={{ color: theme.subtextColor }}>
                {error}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-bold"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.onPrimaryColor,
                }}
              >
                <RefreshCw className="h-4 w-4" />
                {t('workshops.errors.retry')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
