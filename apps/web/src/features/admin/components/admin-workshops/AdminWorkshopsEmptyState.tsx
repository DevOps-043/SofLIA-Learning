'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { BookOpenIcon } from '@heroicons/react/24/outline'

interface AdminWorkshopsEmptyStateProps {
  hasActiveFilters: boolean
}

export function AdminWorkshopsEmptyState({
  hasActiveFilters,
}: AdminWorkshopsEmptyStateProps) {
  const { t } = useTranslation('admin')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-12"
    >
      <div className="flex flex-col items-center justify-center">
        <BookOpenIcon className="h-16 w-16 text-[#6C757D] dark:text-white/30 mb-4" />
        <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-2">
          {t('workshops.empty.title')}
        </h3>
        <p className="text-sm text-[#6C757D] dark:text-white/60 text-center">
          {hasActiveFilters
            ? t('workshops.empty.filters')
            : t('workshops.empty.noWorkshops')}
        </p>
      </div>
    </motion.div>
  )
}
