'use client'

import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

/**
 * NotebookHeader
 *
 * Page-level header with title, subtitle, and a decorative icon.
 * Adapts to dark/light mode through Tailwind classes.
 */
export function NotebookHeader() {
  const { t } = useTranslation('common')

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/20">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t('notebook.pageTitle')}
        </h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 ml-[52px]">
        {t('notebook.pageSubtitle')}
      </p>
    </motion.header>
  )
}
