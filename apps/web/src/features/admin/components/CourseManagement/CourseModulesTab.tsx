'use client'

import { Reorder, motion } from 'framer-motion'
import { Book, Plus, RefreshCw } from 'lucide-react'

import { useTranslation } from 'react-i18next'
import { useCourseManagementContext } from './CourseManagementContext'
import { ModuleCard } from './ModuleCard'

export function CourseModulesTab() {
  const {
    state: {
      showFeedbackMessage,
      recalculatingDurations,
      handleRecalculateDurations,
      fetchModules,
      orderedModules,
      handleModulesReorder,
      setSelectedModule,
      setShowModuleModal,
      modules,
      modulesLoading,
      expandedModules,
    },
    courseId,
  } = useCourseManagementContext()
  const { t } = useTranslation('admin')

  return (
    <motion.div
      key="modules"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-primary dark:text-white">
            {t('workshops.editor.modules.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            {t('workshops.editor.modules.description')}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto">
          <motion.button
            onClick={handleRecalculateDurations}
            disabled={recalculatingDurations}
            whileHover={{
              scale: recalculatingDurations ? 1 : 1.05,
              y: recalculatingDurations ? 0 : -2,
            }}
            whileTap={{ scale: recalculatingDurations ? 1 : 0.95 }}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-200 px-3 py-2 text-xs font-medium text-gray-500 shadow-sm transition-all duration-200 hover:border-accent/30 hover:bg-accent/10 hover:text-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500/30 dark:bg-carbon-950 dark:text-white/60 dark:hover:bg-accent/20 sm:w-auto"
            title={t('workshops.editor.modules.recalculateButton')}
          >
            <motion.div
              animate={recalculatingDurations ? { rotate: 360 } : {}}
              transition={
                recalculatingDurations
                   ? { duration: 1, repeat: Infinity, ease: 'linear' }
                  : {}
              }
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </motion.div>
            <span>
              {recalculatingDurations ? t('workshops.editor.modules.recalculating') : t('workshops.editor.modules.recalculateButton')}
            </span>
          </motion.button>

          <motion.button
            onClick={() => {
              setSelectedModule(null)
              setShowModuleModal(true)
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-sm font-medium text-white shadow-md shadow-primary/20 transition-all duration-200 hover:from-primary hover:to-primary hover:shadow-lg hover:shadow-primary/30 sm:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <Plus className="h-4 w-4" />
            </motion.div>
            <span className="relative z-10">{t('workshops.editor.modules.addModuleButton')}</span>
          </motion.button>
        </div>
      </div>

      {modulesLoading ? (
        <div className="py-16 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="mx-auto mb-3 h-12 w-12 rounded-full border-3 border-accent/20 border-t-accent"
          />
          <p className="text-sm text-gray-500 dark:text-white/60">
            {t('workshops.editor.modules.loading')}
          </p>
        </div>
      ) : modules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center shadow-sm dark:border-gray-500/30 dark:bg-carbon-800"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 dark:from-accent/20 dark:to-primary/20"
          >
            <Book className="h-8 w-8 text-accent" />
          </motion.div>
          <p className="mb-1.5 text-base font-semibold text-primary dark:text-white">
            {t('workshops.editor.modules.emptyTitle')}
          </p>
          <p className="mb-5 text-xs text-gray-500 dark:text-white/60">
            {t('workshops.editor.modules.emptyDescription')}
          </p>
          <motion.button
            onClick={() => {
              setSelectedModule(null)
              setShowModuleModal(true)
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-primary hover:to-primary hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>{t('workshops.editor.modules.createFirstButton')}</span>
          </motion.button>
        </motion.div>
      ) : (
        <Reorder.Group
          axis="y"
          values={orderedModules}
          onReorder={handleModulesReorder}
          className="mx-auto max-w-4xl space-y-4"
        >
          {orderedModules.map((module, index) => (
            <ModuleCard
              key={module.module_id}
              module={module}
              index={index}
              isExpanded={expandedModules.has(module.module_id)}
            />
          ))}
        </Reorder.Group>
      )}
    </motion.div>
  )
}
