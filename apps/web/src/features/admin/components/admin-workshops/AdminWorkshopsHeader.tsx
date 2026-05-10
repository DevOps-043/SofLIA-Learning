'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { PlusIcon } from '@heroicons/react/24/outline'

interface AdminWorkshopsHeaderProps {
  onCreateWorkshop: () => void
}

export function AdminWorkshopsHeader({
  onCreateWorkshop,
}: AdminWorkshopsHeaderProps) {
  const { t } = useTranslation('admin')

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white mb-2">
            {t('workshops.page.title')}
          </h1>
          <p className="text-[#6C757D] dark:text-white/60">
            {t('workshops.page.description')}
          </p>
        </div>
        <motion.button
          onClick={onCreateWorkshop}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-[#0A2540]/20"
        >
          <PlusIcon className="h-5 w-5" />
          <span>{t('workshops.page.createButton')}</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
