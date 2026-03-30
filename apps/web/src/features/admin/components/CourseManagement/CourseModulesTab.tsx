'use client'

import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, ChevronDown, ChevronRight, GripVertical, Book, FileText, ClipboardList, Clock, Pencil, Trash2, CheckCircle2, RefreshCw, ArrowRightLeft } from 'lucide-react'
import type { useCourseManagementLogic } from './hooks/useCourseManagementLogic'

type CourseManagementState = ReturnType<typeof useCourseManagementLogic>

interface CourseModulesTabProps extends CourseManagementState {
  courseId: string
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}min`
}

export function CourseModulesTab(props: CourseModulesTabProps) {
  const {
    courseId,
    showFeedbackMessage,
    recalculatingDurations, setRecalculatingDurations,
    fetchModules,
    orderedModules, orderedLessons,
    handleModulesReorder, handleLessonsReorder,
    setSelectedModule, setShowModuleModal,
    modules, modulesLoading,
    expandedModules, expandedLessons, toggleModule, toggleLesson,
    setEditingModuleId, setSelectedLesson, setShowLessonModal,
    getModuleLessons, getLessonMaterials, getLessonActivities,
    handleEditModule, handleDeleteModule,
    handleCreateLesson, handleDeleteLesson,
    setShowMaterialModal, setEditingLessonId, setEditingMaterial,
    setShowActivityModal, setEditingActivity,
    setMovingLesson, setShowMoveLessonModal,
    fetchActivities, createActivity, updateActivity, deleteActivity, getActivitiesByLesson,
    fetchMaterials, createMaterial, updateMaterial, deleteMaterial, getMaterialsByLesson,
    updateLesson, fetchLessons,
  } = props

  return (
    <motion.div
      key="modules"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header de Sección Rediseñado */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#0A2540] dark:text-white">Módulos del Curso</h2>
          <p className="text-xs text-[#6C757D] dark:text-white/60 mt-1">
            Organiza el contenido en módulos y lecciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={async () => {
              try {
                setRecalculatingDurations(true)
                const res = await fetch('/api/admin/recalculate-durations', { method: 'POST' })
                const data = await res.json()
                if (data.success) {
                  showFeedbackMessage('success', data.message || 'Duraciones recalculadas correctamente')
                  // Refrescar módulos para mostrar las nuevas duraciones
                  await fetchModules(courseId)
                } else {
                  showFeedbackMessage('error', data.error || 'Error al recalcular duraciones')
                }
              } catch (error) {
                showFeedbackMessage('error', 'Error de conexión al recalcular duraciones')
              } finally {
                setRecalculatingDurations(false)
              }
            }}
            disabled={recalculatingDurations}
            whileHover={{ scale: recalculatingDurations ? 1 : 1.05, y: recalculatingDurations ? 0 : -2 }}
            whileTap={{ scale: recalculatingDurations ? 1 : 0.95 }}
            className="group relative px-3 py-2 bg-[#E9ECEF] dark:bg-[#0A0D12] hover:bg-[#00D4B3]/10 dark:hover:bg-[#00D4B3]/20 text-[#6C757D] dark:text-white/60 hover:text-[#00D4B3] rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden text-xs font-medium border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Recalcular duraciones de todas las lecciones"
          >
            <motion.div
              animate={recalculatingDurations ? { rotate: 360 } : {}}
              transition={recalculatingDurations ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.div>
            <span>{recalculatingDurations ? 'Recalculando...' : 'Recalcular tiempos'}</span>
          </motion.button>
          <motion.button
            onClick={() => {
              setSelectedModule(null)
              setShowModuleModal(true)
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-lg flex items-center gap-2 shadow-md shadow-[#0A2540]/20 hover:shadow-lg hover:shadow-[#0A2540]/30 transition-all duration-200 overflow-hidden text-sm font-medium"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <Plus className="w-4 h-4" />
            </motion.div>
            <span className="relative z-10">Agregar Módulo</span>
          </motion.button>
        </div>
      </div>

      {/* Lista de Módulos Rediseñada */}
      {modulesLoading ? (
        <div className="text-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-3 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full mx-auto mb-3"
          />
          <p className="text-sm text-[#6C757D] dark:text-white/60">Cargando módulos...</p>
        </div>
      ) : modules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-[#1E2329] rounded-xl shadow-sm border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-gradient-to-br from-[#00D4B3]/10 to-[#0A2540]/10 dark:from-[#00D4B3]/20 dark:to-[#0A2540]/20 rounded-xl flex items-center justify-center mx-auto mb-4"
          >
            <Book className="w-8 h-8 text-[#00D4B3]" />
          </motion.div>
          <p className="text-[#0A2540] dark:text-white text-base mb-1.5 font-semibold">No hay módulos aún</p>
          <p className="text-[#6C757D] dark:text-white/60 text-xs mb-5">Comienza creando tu primer módulo</p>
          <motion.button
            onClick={() => {
              setSelectedModule(null)
              setShowModuleModal(true)
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-lg inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Crear tu primer módulo</span>
          </motion.button>
        </motion.div>
      ) : (
        <Reorder.Group
          axis="y"
          values={orderedModules}
          onReorder={handleModulesReorder}
          className="space-y-4 max-w-4xl mx-auto"
        >
          {orderedModules.map((module, index) => {
            const moduleLessons = getModuleLessons(module.module_id);
            const isExpanded = expandedModules.has(module.module_id);

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
                    {/* Header del módulo */}
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
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <ChevronDown className="w-5 h-5 text-[#6C757D] dark:text-white/60" />
                                </motion.div>
                              </motion.button>
                            </div>
                            <h3 className="text-lg font-bold text-[#0A2540] dark:text-white line-clamp-2 flex-1">
                              {module.module_title}
                            </h3>
                          </div>

                        {/* Badges y metadata */}
                        <div className="flex items-center gap-2 flex-wrap ml-11">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg ${module.is_published
                              ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/20'
                              : 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20 text-[#6C757D] border border-[#6C757D]/20'
                              }`}
                          >
                            {module.is_published ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Publicado
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                Borrador
                              </>
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

                        {/* Descripción si existe */}
                        {module.module_description && (
                          <p className="text-sm text-[#6C757D] dark:text-white/60 mt-3 ml-11 line-clamp-2">
                            {module.module_description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción Rediseñados */}
                    <div className="flex items-center gap-1.5 ml-11 mt-4 pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                      <motion.button
                        onClick={() => {
                          setEditingModuleId(module.module_id)
                          setSelectedLesson(null)
                          setShowLessonModal(true)
                        }}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 px-2.5 py-1.5 text-xs font-medium text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 hover:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 border border-[#00D4B3]/20 dark:border-[#00D4B3]/30"
                        title="Agregar lección"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Lección</span>
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setSelectedModule(module)
                          setShowModuleModal(true)
                        }}
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

                  {/* Lecciones del Módulo Expandidas */}
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
                                onClick={() => {
                                  setEditingModuleId(module.module_id)
                                  setSelectedLesson(null)
                                  setShowLessonModal(true)
                                }}
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
                              {moduleLessons.map((lesson, lessonIndex) => {
                                const isLessonExpanded = expandedLessons.has(lesson.lesson_id);
                                const lessonMaterials = getLessonMaterials(lesson.lesson_id);
                                const lessonActivities = getLessonActivities(lesson.lesson_id);

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
                                            <motion.div
                                              animate={{ rotate: isLessonExpanded ? 180 : 0 }}
                                              transition={{ duration: 0.2 }}
                                            >
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
                                              <span className="text-xs text-[#6C757D] dark:text-white/60">
                                                por {lesson.instructor_name}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                                        <motion.button
                                          onClick={() => {
                                            setSelectedLesson(lesson)
                                            setEditingModuleId(lesson.module_id)
                                            setShowLessonModal(true)
                                          }}
                                          whileHover={{ scale: 1.1, y: -1 }}
                                          whileTap={{ scale: 0.9 }}
                                          className="p-1.5 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 dark:hover:bg-[#10B981]/30 rounded-md transition-all duration-200 border border-[#10B981]/20 dark:border-[#10B981]/30"
                                          title="Editar lección"
                                        >
                                          <Pencil className="w-3.5 h-3.5 text-[#10B981]" />
                                        </motion.button>
                                        <motion.button
                                          onClick={() => {
                                            setEditingLessonId(lesson.lesson_id)
                                            setShowMaterialModal(true)
                                          }}
                                          whileHover={{ scale: 1.1, y: -1 }}
                                          whileTap={{ scale: 0.9 }}
                                          className="p-1.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/30 hover:bg-[#0A2540]/20 dark:hover:bg-[#0A2540]/40 rounded-md transition-all duration-200 border border-[#0A2540]/20 dark:border-[#0A2540]/40"
                                          title="Agregar material"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
                                        </motion.button>
                                        <motion.button
                                          onClick={() => {
                                            setEditingLessonId(lesson.lesson_id)
                                            setShowActivityModal(true)
                                          }}
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
                                      {isLessonExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-4 pb-4 pt-0 mt-2 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                              {/* Materiales */}
                                              <div className="bg-white dark:bg-[#1E2329] rounded-lg p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                                                <div className="flex items-center justify-between mb-2">
                                                  <h5 className="text-xs font-bold text-[#0A2540] dark:text-white flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
                                                    Materiales
                                                    <span className="px-1.5 py-0.5 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 text-[#0A2540] dark:text-[#00D4B3] rounded text-xs font-semibold">
                                                      {lessonMaterials.length}
                                                    </span>
                                                  </h5>
                                                  <motion.button
                                                    onClick={() => {
                                                      setEditingLessonId(lesson.lesson_id)
                                                      setShowMaterialModal(true)
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="text-xs font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors"
                                                  >
                                                    + Agregar
                                                  </motion.button>
                                                </div>
                                                {lessonMaterials.length === 0 ? (
                                                  <p className="text-xs text-[#6C757D] dark:text-white/40 italic text-center py-3">No hay materiales</p>
                                                ) : (
                                                  <div className="space-y-1.5">
                                                    {lessonMaterials.map(material => (
                                                      <motion.div
                                                        key={material.material_id}
                                                        whileHover={{ x: 2 }}
                                                        className="text-xs p-2 bg-gradient-to-r from-[#0A2540]/5 to-[#0A2540]/10 dark:from-[#0A2540]/20 dark:to-[#0A2540]/10 rounded-lg border border-[#0A2540]/10 dark:border-[#0A2540]/30 flex items-center justify-between group"
                                                      >
                                                        <div className="flex-1 min-w-0">
                                                          <div className="font-medium text-[#0A2540] dark:text-white truncate">{material.material_title}</div>
                                                          <div className="text-[#6C757D] dark:text-white/60 text-xs mt-0.5">
                                                            {material.material_type}
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                          <motion.button
                                                            onClick={() => {
                                                              setEditingMaterial(material)
                                                              setEditingLessonId(lesson.lesson_id)
                                                              setShowMaterialModal(true)
                                                            }}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-1 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 rounded transition-colors"
                                                            title="Editar material"
                                                          >
                                                            <Pencil className="w-3 h-3 text-[#10B981]" />
                                                          </motion.button>
                                                          <motion.button
                                                            onClick={async () => {
                                                              if (confirm('¿Estás seguro de eliminar este material?')) {
                                                                await deleteMaterial(material.material_id)
                                                                await fetchMaterials(lesson.lesson_id)
                                                              }
                                                            }}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                            title="Eliminar material"
                                                          >
                                                            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                                          </motion.button>
                                                        </div>
                                                      </motion.div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>

                                              {/* Actividades */}
                                              <div className="bg-white dark:bg-[#1E2329] rounded-lg p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                                                <div className="flex items-center justify-between mb-2">
                                                  <h5 className="text-xs font-bold text-[#0A2540] dark:text-white flex items-center gap-1.5">
                                                    <ClipboardList className="w-3.5 h-3.5 text-[#00D4B3]" />
                                                    Actividades
                                                    <span className="px-1.5 py-0.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] rounded text-xs font-semibold">
                                                      {lessonActivities.length}
                                                    </span>
                                                  </h5>
                                                  <motion.button
                                                    onClick={() => {
                                                      setEditingLessonId(lesson.lesson_id)
                                                      setShowActivityModal(true)
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="text-xs font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors"
                                                  >
                                                    + Agregar
                                                  </motion.button>
                                                </div>
                                                {lessonActivities.length === 0 ? (
                                                  <p className="text-xs text-[#6C757D] dark:text-white/40 italic text-center py-3">No hay actividades</p>
                                                ) : (
                                                  <div className="space-y-1.5">
                                                    {lessonActivities.map(activity => (
                                                      <motion.div
                                                        key={activity.activity_id}
                                                        whileHover={{ x: 2 }}
                                                        className="text-xs p-2 bg-gradient-to-r from-[#00D4B3]/5 to-[#00D4B3]/10 dark:from-[#00D4B3]/20 dark:to-[#00D4B3]/10 rounded-lg border border-[#00D4B3]/10 dark:border-[#00D4B3]/30 flex items-center justify-between group"
                                                      >
                                                        <div className="flex-1 min-w-0">
                                                          <div className="font-medium text-[#0A2540] dark:text-white truncate">{activity.activity_title}</div>
                                                          <div className="text-[#6C757D] dark:text-white/60 text-xs mt-0.5">
                                                            {activity.activity_type}
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                          <motion.button
                                                            onClick={() => {
                                                              setEditingActivity(activity)
                                                              setEditingLessonId(lesson.lesson_id)
                                                              setShowActivityModal(true)
                                                            }}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-1 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 rounded transition-colors"
                                                            title="Editar actividad"
                                                          >
                                                            <Pencil className="w-3 h-3 text-[#10B981]" />
                                                          </motion.button>
                                                          <motion.button
                                                            onClick={async () => {
                                                              if (confirm('¿Estás seguro de eliminar esta actividad?')) {
                                                                await deleteActivity(activity.activity_id)
                                                                await fetchActivities(lesson.lesson_id)
                                                              }
                                                            }}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                            title="Eliminar actividad"
                                                          >
                                                            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                                          </motion.button>
                                                        </div>
                                                      </motion.div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </Reorder.Item>
                                )
                              })}
                            </Reorder.Group>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reorder.Item>
              )
            })}
        </Reorder.Group>
      )}
    </motion.div>
  )
}
