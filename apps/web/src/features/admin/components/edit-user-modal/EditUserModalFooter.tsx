'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface EditUserModalFooterProps {
  isLoading: boolean
  onClose: () => void
}

export function EditUserModalFooter({
  isLoading,
  onClose,
}: EditUserModalFooterProps) {
  const { t } = useTranslation(['admin', 'common'])
  return (
    <div className="px-6 py-4 bg-gray-200/30 dark:bg-carbon-950 border-t border-gray-200 dark:border-gray-500/30 flex items-center justify-end gap-3">
      <motion.button
        type="button"
        onClick={onClose}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-6 py-2.5 text-gray-500 dark:text-white/70 bg-white dark:bg-carbon-800 hover:bg-gray-200 dark:hover:bg-primary/30 rounded-xl text-sm font-medium transition-colors duration-200 border border-gray-200 dark:border-gray-500/30"
        disabled={isLoading}
      >
        {t('common:actions.cancel')}
      </motion.button>
      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-6 py-2.5 bg-primary hover:bg-primary text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{t('admin:users.editModal.saving')}</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-4 w-4" />
            <span>{t('admin:users.editModal.saveChanges')}</span>
          </>
        )}
      </motion.button>
    </div>
  )
}
