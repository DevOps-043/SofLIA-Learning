'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'

import { useTranslation } from 'react-i18next'
import { useCourseManagementContext } from './CourseManagementContext'

export function CourseManagementHeader() {
  const { t } = useTranslation('admin')
  const {
    state: { estimatingMissingTimes, handleEstimateMissingTimes, isNewCourse, router },
  } = useCourseManagementContext()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <motion.button
        onClick={() => router.back()}
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        className="group mb-6 inline-flex items-center text-gray-500 transition-colors hover:text-primary dark:text-white/60 dark:hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform" />
        <span className="text-sm font-medium">{t('workshops.editor.header.backButton')}</span>
      </motion.button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="mb-2 text-2xl font-bold text-primary dark:text-white sm:text-3xl md:text-4xl">
            {isNewCourse ? t('workshops.editor.header.createTitle') : t('workshops.editor.header.editTitle')}
          </h1>
          <p className="max-w-2xl text-sm text-gray-500 dark:text-white/60 sm:text-base">
            {t('workshops.editor.header.description')}
          </p>
        </div>

        {!isNewCourse && (
          <motion.button
            onClick={() => void handleEstimateMissingTimes()}
            disabled={estimatingMissingTimes}
            whileHover={{ scale: estimatingMissingTimes ? 1 : 1.02 }}
            whileTap={{ scale: estimatingMissingTimes ? 1 : 0.98 }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[var(--color-legacy-00c2a5)] px-4 py-3 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:justify-start"
          >
            {estimatingMissingTimes ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>
              {estimatingMissingTimes
                ? t('workshops.editor.header.estimatingTimes')
                : t('workshops.editor.header.estimateTimesButton')}
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
