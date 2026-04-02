'use client'

import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { FileText, ClipboardList, Clock, Pencil, Trash2, ChevronDown, GripVertical } from 'lucide-react'
import { useCourseManagementContext } from './CourseManagementContext'
import { LessonResourcePanel } from './LessonResourcePanel'
import { formatDuration } from './CourseManagement.utils'
import type { AdminLesson } from '../../services/adminLessons.service'
import type { AdminMaterial } from '../../services/adminMaterials.service'
import type { AdminActivity } from '../../services/adminActivities.service'

interface LessonItemProps {
  lesson: AdminLesson
  lessonIndex: number
  isExpanded: boolean
  materials: AdminMaterial[]
  activities: AdminActivity[]
}

export function LessonItem({ lesson, lessonIndex, isExpanded, materials, activities }: LessonItemProps) {
  const {
    toggleLesson,
    setSelectedLesson, setEditingModuleId, setShowLessonModal,
    setEditingLessonId, setShowMaterialModal, setShowActivityModal,
    handleDeleteLesson,
  } = useCourseManagementContext().state

  return (
    <Reorder.Item
      key={lesson.lesson_id}
      value={lesson}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: lessonIndex * 0.05 }}
      className="bg-[#E9ECEF]/30 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden hover:border-[#00D4B3]/30 dark:hover:border-[#00D4B3]/30 transition-all duration-300"
    >
      {/* Header de la Lección */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/50 dark:hover:bg-[#1E2329] rounded transition-colors">
              <GripVertical className="w-4 h-4 text-[#6C757D]/40" />
            </div>
            <motion.button
              onClick={() => toggleLesson(lesson.lesson_id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/50 dark:hover:bg-[#1E2329] transition-colors"
            >
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-[#6C757D] dark:text-white/60" />
              </motion.div>
            </motion.button>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-[#0A2540] dark:text-white line-clamp-1">
              {lesson.lesson_title}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-[#6C757D] dark:text-white/60 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(lesson.total_duration_minutes || Math.floor(lesson.duration_seconds / 60))}
              </span>
              {lesson.instructor_name && (
                <span className="text-xs text-[#6C757D] dark:text-white/60">por {lesson.instructor_name}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          <motion.button
            onClick={() => { setSelectedLesson(lesson); setEditingModuleId(lesson.module_id); setShowLessonModal(true) }}
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 dark:hover:bg-[#10B981]/30 rounded-md transition-all duration-200 border border-[#10B981]/20 dark:border-[#10B981]/30"
            title="Editar lección"
          >
            <Pencil className="w-3.5 h-3.5 text-[#10B981]" />
          </motion.button>
          <motion.button
            onClick={() => { setEditingLessonId(lesson.lesson_id); setShowMaterialModal(true) }}
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/30 hover:bg-[#0A2540]/20 dark:hover:bg-[#0A2540]/40 rounded-md transition-all duration-200 border border-[#0A2540]/20 dark:border-[#0A2540]/40"
            title="Agregar material"
          >
            <FileText className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
          </motion.button>
          <motion.button
            onClick={() => { setEditingLessonId(lesson.lesson_id); setShowActivityModal(true) }}
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 hover:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30 rounded-md transition-all duration-200 border border-[#00D4B3]/20 dark:border-[#00D4B3]/30"
            title="Agregar actividad"
          >
            <ClipboardList className="w-3.5 h-3.5 text-[#00D4B3]" />
          </motion.button>
          <motion.button
            onClick={() => handleDeleteLesson(lesson.lesson_id)}
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-all duration-200 border border-red-200 dark:border-red-900/40"
            title="Eliminar lección"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </motion.button>
        </div>
      </div>

      {/* Materiales y Actividades Expandidas */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 mt-2 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
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
