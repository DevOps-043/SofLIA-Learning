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
      className="group relative overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
    >
      <div
        className={`h-1 ${
          module.is_published
            ? 'bg-gradient-to-r from-[#10B981] to-[#00D4B3]'
            : 'bg-gradient-to-r from-[#6C757D] to-[#6C757D]/50'
        }`}
      />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex shrink-0 items-center gap-1">
              <div className="cursor-grab rounded p-1 transition-colors hover:bg-[#E9ECEF] active:cursor-grabbing dark:hover:bg-[#0A0D12]">
                <GripVertical className="h-4 w-4 text-[#6C757D]/40" />
              </div>
              <motion.button
                onClick={() => toggleModule(module.module_id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[#E9ECEF] dark:hover:bg-[#0A0D12]"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-5 w-5 text-[#6C757D] dark:text-white/60" />
                </motion.div>
              </motion.button>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-lg font-bold text-[#0A2540] dark:text-white">
                {module.module_title}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    module.is_published
                      ? 'border border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981] dark:bg-[#10B981]/20'
                      : 'border border-[#6C757D]/20 bg-[#6C757D]/10 text-[#6C757D] dark:bg-[#6C757D]/20'
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
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#E9ECEF]/50 px-2.5 py-1 text-xs text-[#6C757D] dark:bg-[#0A0D12] dark:text-white/60">
                  <Clock className="h-3 w-3" />
                  {formatDuration(module.module_duration_minutes || 0)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#E9ECEF]/50 px-2.5 py-1 text-xs text-[#6C757D] dark:bg-[#0A0D12] dark:text-white/60">
                  <Book className="h-3 w-3" />
                  {ta('courseManagement.lessonCount', { count: moduleLessons.length })}
                </span>
              </div>

              {module.module_description && (
                <p className="mt-3 line-clamp-3 text-sm text-[#6C757D] dark:text-white/60">
                  {module.module_description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#E9ECEF] pt-4 dark:border-[#6C757D]/30">
            <motion.button
              onClick={() => {
                setEditingModuleId(module.module_id)
                setSelectedLesson(null)
                setShowLessonModal(true)
              }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[#00D4B3]/20 bg-[#00D4B3]/10 px-2.5 py-2 text-xs font-medium text-[#00D4B3] transition-all duration-200 hover:bg-[#00D4B3]/20 dark:border-[#00D4B3]/30 dark:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30 sm:min-w-[180px] sm:flex-1"
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
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E9ECEF] bg-[#E9ECEF] text-[#0A2540] transition-all duration-200 hover:bg-[#0A2540]/5 dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white/80 dark:hover:bg-[#0A2540]/20"
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
            <div className="mt-4 border-t border-[#E9ECEF] px-4 pb-4 pt-0 dark:border-[#6C757D]/30 sm:px-5 sm:pb-5">
              {moduleLessons.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-dashed border-[#E9ECEF] bg-[#E9ECEF]/30 py-8 text-center dark:border-[#6C757D]/30 dark:bg-[#0A0D12]"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D4B3]/20 to-[#0A2540]/20 dark:from-[#00D4B3]/30 dark:to-[#0A2540]/30">
                    <Plus className="h-6 w-6 text-[#00D4B3]" />
                  </div>
                  <p className="mb-3 text-sm text-[#6C757D] dark:text-white/60">
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
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#00D4B3] transition-colors hover:text-[#00D4B3]/80"
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
