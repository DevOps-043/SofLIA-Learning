'use client'

import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, ChevronDown, GripVertical, Book, FileText, Clock, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { useCourseManagementContext } from './CourseManagementContext'
import { LessonItem } from './LessonItem'
import { formatDuration } from './CourseManagement.utils'
import type { AdminModule } from '../../services/adminModules.service'

interface ModuleCardProps {
  module: AdminModule
  index: number
  isExpanded: boolean
}

export function ModuleCard({ module, index, isExpanded }: ModuleCardProps) {
  const {
    state: {
      getModuleLessons, getLessonMaterials, getLessonActivities,
      expandedLessons, toggleModule, handleLessonsReorder,
      setSelectedModule, setShowModuleModal,
      setEditingModuleId, setSelectedLesson, setShowLessonModal,
      handleDeleteModule,
    },
  } = useCourseManagementContext()

  const moduleLessons = getModuleLessons(module.module_id)

  return (
    <Reorder.Item
      key={module.module_id}
      value={module}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Borde superior con color según estado */}
      <div className={`h-1 ${module.is_published
        ? 'bg-gradient-to-r from-[#10B981] to-[#00D4B3]'
        : 'bg-gradient-to-r from-[#6C757D] to-[#6C757D]/50'
      }`} />

      {/* Contenido del módulo */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-[#E9ECEF] dark:hover:bg-[#0A0D12] rounded transition-colors mr-1">
                  <GripVertical className="w-4 h-4 text-[#6C757D]/40" />
                </div>
                <motion.button
                  onClick={() => toggleModule(module.module_id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#E9ECEF] dark:hover:bg-[#0A0D12] transition-colors"
                >
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-5 h-5 text-[#6C757D] dark:text-white/60" />
                  </motion.div>
                </motion.button>
              </div>
              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white line-clamp-2 flex-1">
                {module.module_title}
              </h3>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap ml-11">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg ${module.is_published
                  ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/20'
                  : 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20 text-[#6C757D] border border-[#6C757D]/20'
                }`}
              >
                {module.is_published ? (
                  <><CheckCircle2 className="w-3 h-3" />Publicado</>
                ) : (
                  <><FileText className="w-3 h-3" />Borrador</>
                )}
              </motion.span>
              <span className="inline-flex items-center gap-1 text-xs text-[#6C757D] dark:text-white/60 px-2.5 py-1 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-lg">
                <Clock className="w-3 h-3" />
                {formatDuration(module.module_duration_minutes || 0)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#6C757D] dark:text-white/60 px-2.5 py-1 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-lg">
                <Book className="w-3 h-3" />
                {moduleLessons.length} {moduleLessons.length === 1 ? 'lección' : 'lecciones'}
              </span>
            </div>

            {module.module_description && (
              <p className="text-sm text-[#6C757D] dark:text-white/60 mt-3 ml-11 line-clamp-2">
                {module.module_description}
              </p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-1.5 ml-11 mt-4 pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
          <motion.button
            onClick={() => { setEditingModuleId(module.module_id); setSelectedLesson(null); setShowLessonModal(true) }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-2.5 py-1.5 text-xs font-medium text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 hover:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 border border-[#00D4B3]/20 dark:border-[#00D4B3]/30"
            title="Agregar lección"
          >
            <Plus className="w-3 h-3" />
            <span>Lección</span>
          </motion.button>
          <motion.button
            onClick={() => { setSelectedModule(module); setShowModuleModal(true) }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#0A2540] dark:text-white/80 bg-[#E9ECEF] dark:bg-[#0A0D12] hover:bg-[#0A2540]/5 dark:hover:bg-[#0A2540]/20 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 border border-[#E9ECEF] dark:border-[#6C757D]/30"
            title="Editar módulo"
          >
            <Pencil className="w-3 h-3" />
          </motion.button>
          <motion.button
            onClick={() => handleDeleteModule(module.module_id)}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-all duration-200 flex items-center justify-center border border-red-200 dark:border-red-900/40"
            title="Eliminar módulo"
          >
            <Trash2 className="w-3 h-3" />
          </motion.button>
        </div>
      </div>

      {/* Lecciones expandidas */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 mt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
              {moduleLessons.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] rounded-xl border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00D4B3]/20 to-[#0A2540]/20 dark:from-[#00D4B3]/30 dark:to-[#0A2540]/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-[#00D4B3]" />
                  </div>
                  <p className="text-sm text-[#6C757D] dark:text-white/60 mb-3">No hay lecciones en este módulo</p>
                  <motion.button
                    onClick={() => { setEditingModuleId(module.module_id); setSelectedLesson(null); setShowLessonModal(true) }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agrega tu primera lección</span>
                  </motion.button>
                </motion.div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={moduleLessons}
                  onReorder={(newOrder) => handleLessonsReorder(module.module_id, newOrder)}
                  className="space-y-2 mt-2"
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
