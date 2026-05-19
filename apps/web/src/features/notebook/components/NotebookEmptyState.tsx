'use client'

import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { BookOpen, FileX } from 'lucide-react'

interface NotebookEmptyStateProps {
  isCourseFiltered?: boolean
}

/**
 * NotebookEmptyState
 *
 * Shown when no notes exist, either globally or for a specific course.
 */
export function NotebookEmptyState({
  isCourseFiltered = false,
}: NotebookEmptyStateProps) {
  const { t } = useTranslation('common')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 mb-5">
        {isCourseFiltered ? (
          <FileX className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        ) : (
          <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {t('notebook.empty.title')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
        {isCourseFiltered
          ? t('notebook.empty.courseEmpty')
          : t('notebook.empty.description')}
      </p>
    </motion.div>
  )
}
