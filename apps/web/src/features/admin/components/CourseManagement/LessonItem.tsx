'use client'

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

  return (
    <Reorder.Item
      key={lesson.lesson_id}
      value={lesson}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: lessonIndex * 0.05 }}
      className="overflow-hidden rounded-xl border border-[#E9ECEF] bg-[#E9ECEF]/30 transition-all duration-300 hover:border-[#00D4B3]/30 dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:hover:border-[#00D4B3]/30"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex shrink-0 items-center gap-1">
            <div className="cursor-grab rounded p-1 transition-colors hover:bg-white/50 active:cursor-grabbing dark:hover:bg-[#1E2329]">
              <GripVertical className="h-4 w-4 text-[#6C757D]/40" />
            </div>
            <motion.button
              onClick={() => toggleLesson(lesson.lesson_id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white/50 dark:hover:bg-[#1E2329]"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
              </motion.div>
            </motion.button>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-sm font-semibold text-[#0A2540] dark:text-white">
              {lesson.lesson_title}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6C757D] dark:text-white/60">
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

        <div className="flex flex-wrap items-center gap-2 border-t border-[#E9ECEF] pt-3 dark:border-[#6C757D]/30">
          <motion.button
            onClick={() => {
              setSelectedLesson(lesson)
              setEditingModuleId(lesson.module_id)
              setShowLessonModal(true)
            }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#10B981]/20 bg-[#10B981]/10 transition-all duration-200 hover:bg-[#10B981]/20 dark:border-[#10B981]/30 dark:bg-[#10B981]/20 dark:hover:bg-[#10B981]/30"
            title="Editar leccion"
          >
            <Pencil className="h-3.5 w-3.5 text-[#10B981]" />
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingLessonId(lesson.lesson_id)
              setShowMaterialModal(true)
            }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#0A2540]/20 bg-[#0A2540]/10 transition-all duration-200 hover:bg-[#0A2540]/20 dark:border-[#0A2540]/40 dark:bg-[#0A2540]/30 dark:hover:bg-[#0A2540]/40"
            title="Agregar material"
          >
            <FileText className="h-3.5 w-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingLessonId(lesson.lesson_id)
              setShowActivityModal(true)
            }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#00D4B3]/20 bg-[#00D4B3]/10 transition-all duration-200 hover:bg-[#00D4B3]/20 dark:border-[#00D4B3]/30 dark:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30"
            title="Agregar actividad"
          >
            <ClipboardList className="h-3.5 w-3.5 text-[#00D4B3]" />
          </motion.button>
          <motion.button
            onClick={() => handleDeleteLesson(lesson.lesson_id)}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 transition-all duration-200 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:hover:bg-red-900/30"
            title="Eliminar leccion"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </motion.button>
        </div>
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
            <div className="mt-2 border-t border-[#E9ECEF] px-4 pb-4 pt-0 dark:border-[#6C757D]/30">
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
