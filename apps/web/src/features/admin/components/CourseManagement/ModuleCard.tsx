'use client'

import { useState } from 'react'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import {
  Book,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import type { AdminModule } from '../../services/adminModules.service'
import { useTranslation } from 'react-i18next'
import { useCourseManagementContext } from './CourseManagementContext'
import { formatDuration } from './CourseManagement.utils'
import { LessonItem } from './LessonItem'

interface ModuleCardProps {
  module: AdminModule
  index: number
  isExpanded: boolean
}

export function ModuleCard({ module, index, isExpanded }: ModuleCardProps) {
  const {
    state: {
      getLessonActivities,
      getLessonMaterials,
      getModuleLessons,
      expandedLessons,
      toggleModule,
      handleLessonsReorder,
      setSelectedModule,
      setShowModuleModal,
      setEditingModuleId,
      setSelectedLesson,
      setShowLessonModal,
      handleDeleteModule,
    },
  } = useCourseManagementContext()

  const moduleLessons = getModuleLessons(module.module_id)
  const { t } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const [pendingDelete, setPendingDelete] = useState(false)

  return (
    <Reorder.Item
      key={module.module_id}
      value={module}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-gray-500/30 dark:bg-carbon-800"
    >
      <div
        className={`h-1 ${
          module.is_published
            ? 'bg-gradient-to-r from-success to-accent'
            : 'bg-gradient-to-r from-gray-500 to-gray-500/50'
        }`}
      />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex shrink-0 items-center gap-1">
              <div className="cursor-grab rounded p-1 transition-colors hover:bg-gray-200 active:cursor-grabbing dark:hover:bg-carbon-950">
                <GripVertical className="h-4 w-4 text-gray-500/40" />
              </div>
              <motion.button
                onClick={() => toggleModule(module.module_id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-carbon-950"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-white/60" />
                </motion.div>
              </motion.button>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-lg font-bold text-primary dark:text-white">
                {module.module_title}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    module.is_published
                      ? 'border border-success/20 bg-success/10 text-success dark:bg-success/20'
                      : 'border border-gray-500/20 bg-gray-500/10 text-gray-500 dark:bg-gray-500/20'
                  }`}
                >
                  {module.is_published ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      {ta('courseManagement.published')}
                    </>
                  ) : (
                    <>
                      <FileText className="h-3 w-3" />
                      {ta('courseManagement.draft')}
                    </>
                  )}
                </motion.span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-gray-200/50 px-2.5 py-1 text-xs text-gray-500 dark:bg-carbon-950 dark:text-white/60">
                  <Clock className="h-3 w-3" />
                  {formatDuration(module.module_duration_minutes || 0)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-gray-200/50 px-2.5 py-1 text-xs text-gray-500 dark:bg-carbon-950 dark:text-white/60">
                  <Book className="h-3 w-3" />
                  {ta('courseManagement.lessonCount', { count: moduleLessons.length })}
                </span>
              </div>

              {module.module_description && (
                <p className="mt-3 line-clamp-3 text-sm text-gray-500 dark:text-white/60">
                  {module.module_description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4 dark:border-gray-500/30">
            <motion.button
              onClick={() => {
                setEditingModuleId(module.module_id)
                setSelectedLesson(null)
                setShowLessonModal(true)
              }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-accent/20 bg-accent/10 px-2.5 py-2 text-xs font-medium text-accent transition-all duration-200 hover:bg-accent/20 dark:border-accent/30 dark:bg-accent/20 dark:hover:bg-accent/30 sm:min-w-[180px] sm:flex-1"
              title={ta('courseManagement.addLesson')}
            >
              <Plus className="h-3 w-3" />
              <span>{ta('courseManagement.addLessonShort')}</span>
            </motion.button>
            <motion.button
              onClick={() => {
                setSelectedModule(module)
                setShowModuleModal(true)
              }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-200 text-primary transition-all duration-200 hover:bg-primary/5 dark:border-gray-500/30 dark:bg-carbon-950 dark:text-white/80 dark:hover:bg-primary/20"
              title={t('actions.edit')}
            >
              <Pencil className="h-3.5 w-3.5" />
            </motion.button>
            <motion.button
              onClick={() => setPendingDelete(true)}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-all duration-200 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              title={t('actions.delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </motion.button>
          </div>
          {pendingDelete && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2">
              <p className="text-xs text-red-700 dark:text-red-400">{ta('courseManagement.confirmDeleteModule')}</p>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setPendingDelete(false)} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-50 transition-colors">{t('actions.cancel')}</button>
                <button onClick={() => { setPendingDelete(false); handleDeleteModule(module.module_id) }} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">{t('actions.delete')}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-gray-200 px-4 pb-4 pt-0 dark:border-gray-500/30 sm:px-5 sm:pb-5">
              {moduleLessons.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-200/30 py-8 text-center dark:border-gray-500/30 dark:bg-carbon-950"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 dark:from-accent/30 dark:to-primary/30">
                    <Plus className="h-6 w-6 text-accent" />
                  </div>
                  <p className="mb-3 text-sm text-gray-500 dark:text-white/60">
                    No hay lecciones en este modulo
                  </p>
                  <motion.button
                    onClick={() => {
                      setEditingModuleId(module.module_id)
                      setSelectedLesson(null)
                      setShowLessonModal(true)
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent/80"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Agrega tu primera leccion</span>
                  </motion.button>
                </motion.div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={moduleLessons}
                  onReorder={(newOrder) =>
                    handleLessonsReorder(module.module_id, newOrder)
                  }
                  className="mt-4 space-y-2"
                >
                  {moduleLessons.map((lesson, lessonIndex) => (
                    <LessonItem
                      key={lesson.lesson_id}
                      lesson={lesson}
                      lessonIndex={lessonIndex}
                      isExpanded={expandedLessons.has(lesson.lesson_id)}
                      materials={getLessonMaterials(lesson.lesson_id)}
                      activities={getLessonActivities(lesson.lesson_id)}
                    />
                  ))}
                </Reorder.Group>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}
