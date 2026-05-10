'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface AdminWorkshopsErrorStateProps {
  error: string
  onRetry: () => void
}

export function AdminWorkshopsErrorState({
  error,
  onRetry,
}: AdminWorkshopsErrorStateProps) {
  const { t } = useTranslation('admin')

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl p-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <XMarkIcon className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 mb-1">
              {t('workshops.errors.load')}
            </h3>
            <p className="text-xs text-red-500/80 dark:text-red-400/80">
              {error}
            </p>
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
            >
              {t('workshops.errors.retry')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
