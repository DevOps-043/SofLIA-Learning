'use client'

import { useState } from 'react'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import {
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  GripVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { AdminActivity } from '../../services/adminActivities.service'
import type { AdminLesson } from '../../services/adminLessons.service'
import type { AdminMaterial } from '../../services/adminMaterials.service'
import { useTranslation } from 'react-i18next'
import { useCourseManagementContext } from './CourseManagementContext'
import { formatDuration } from './CourseManagement.utils'
import { LessonResourcePanel } from './LessonResourcePanel'

interface LessonItemProps {
  lesson: AdminLesson
  lessonIndex: number
  isExpanded: boolean
  materials: AdminMaterial[]
  activities: AdminActivity[]
}

export function LessonItem({
  lesson,
  lessonIndex,
  isExpanded,
  materials,
  activities,
}: LessonItemProps) {
  const {
    toggleLesson,
    setSelectedLesson,
    setEditingModuleId,
    setShowLessonModal,
    setEditingLessonId,
    setShowMaterialModal,
    setShowActivityModal,
    handleDeleteLesson,
  } = useCourseManagementContext().state
  const { t } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const [pendingDelete, setPendingDelete] = useState(false)

  return (
    <Reorder.Item
      key={lesson.lesson_id}
      value={lesson}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: lessonIndex * 0.05 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-gray-200/30 transition-all duration-300 hover:border-accent/30 dark:border-gray-500/30 dark:bg-carbon-950 dark:hover:border-accent/30"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex shrink-0 items-center gap-1">
            <div className="cursor-grab rounded p-1 transition-colors hover:bg-white/50 active:cursor-grabbing dark:hover:bg-carbon-800">
              <GripVertical className="h-4 w-4 text-gray-500/40" />
            </div>
            <motion.button
              onClick={() => toggleLesson(lesson.lesson_id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white/50 dark:hover:bg-carbon-800"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-white/60" />
              </motion.div>
            </motion.button>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-sm font-semibold text-primary dark:text-white">
              {lesson.lesson_title}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-white/60">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(
                  lesson.total_duration_minutes ||
                    Math.floor(lesson.duration_seconds / 60),
                )}
              </span>
              {lesson.instructor_name && <span>por {lesson.instructor_name}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-500/30">
          <motion.button
            onClick={() => {
              setSelectedLesson(lesson)
              setEditingModuleId(lesson.module_id)
              setShowLessonModal(true)
            }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-success/20 bg-success/10 transition-all duration-200 hover:bg-success/20 dark:border-success/30 dark:bg-success/20 dark:hover:bg-success/30"
            title={t('actions.edit')}
          >
            <Pencil className="h-3.5 w-3.5 text-success" />
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingLessonId(lesson.lesson_id)
              setShowMaterialModal(true)
            }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 transition-all duration-200 hover:bg-primary/20 dark:border-primary/40 dark:bg-primary/30 dark:hover:bg-primary/40"
            title={ta('courseManagement.addMaterial')}
          >
            <FileText className="h-3.5 w-3.5 text-primary dark:text-accent" />
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingLessonId(lesson.lesson_id)
              setShowActivityModal(true)
            }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/20 bg-accent/10 transition-all duration-200 hover:bg-accent/20 dark:border-accent/30 dark:bg-accent/20 dark:hover:bg-accent/30"
            title={ta('courseManagement.addActivity')}
          >
            <ClipboardList className="h-3.5 w-3.5 text-accent" />
          </motion.button>
          <motion.button
            onClick={() => setPendingDelete(true)}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 transition-all duration-200 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:hover:bg-red-900/30"
            title={t('actions.delete')}
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </motion.button>
        </div>
        {pendingDelete && (
          <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2">
            <p className="text-xs text-red-700 dark:text-red-400">{ta('courseManagement.confirmDeleteLesson')}</p>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setPendingDelete(false)} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-50 transition-colors">{t('actions.cancel')}</button>
              <button onClick={() => { setPendingDelete(false); handleDeleteLesson(lesson.lesson_id) }} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">{t('actions.delete')}</button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 border-t border-gray-200 px-4 pb-4 pt-0 dark:border-gray-500/30">
              <LessonResourcePanel
                lessonId={lesson.lesson_id}
                materials={materials}
                activities={activities}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}
