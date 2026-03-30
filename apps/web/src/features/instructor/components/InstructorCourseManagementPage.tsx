'use client'

import { ArrowLeft, Plus, ChevronDown, ChevronRight, Clock, FileText, ClipboardList, Book, Settings, Eye, Edit3, Trash2, BarChart3, LayoutDashboard, Users2, DollarSign, Star, Sigma, Briefcase, LineChart as LineChartIcon, ListChecks, CheckCircle2, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { EnrollmentTrendChart, ProgressDistributionChart, EngagementScatterChart, CompletionRateChart, DonutPieChart } from '@/features/admin/components/AdvancedCharts'
import { AdminModule } from '@/features/admin/services/adminModules.service'
import { AdminLesson } from '@/features/admin/services/adminLessons.service'
import { ModuleModal } from '@/features/admin/components/ModuleModal'
import { LessonModal } from '@/features/admin/components/LessonModal'
import { MaterialModal } from '@/features/admin/components/MaterialModal'
import { ActivityModal } from '@/features/admin/components/ActivityModal'
import { ImageUploadCourse } from './ImageUploadCourse'
import { CertificateTemplatePreview } from '@/features/admin/components/CertificateTemplatePreview'
import { CourseSkillsSelector } from '@/features/courses/components/CourseSkillsSelector'
import { useInstructorCourseManagementLogic } from '@/features/instructor/hooks/useInstructorCourseManagementLogic'

interface InstructorCourseManagementPageProps {
  courseId: string
}

export function InstructorCourseManagementPage({ courseId }: InstructorCourseManagementPageProps) {
  const {
    router,
    activeTab,
    setActiveTab,
    expandedModules,
    expandedLessons,
    showModuleModal,
    setShowModuleModal,
    showLessonModal,
    setShowLessonModal,
    showMaterialModal,
    setShowMaterialModal,
    showActivityModal,
    setShowActivityModal,
    selectedModule,
    setSelectedModule,
    selectedLesson,
    setSelectedLesson,
    editingModuleId,
    setEditingModuleId,
    editingLessonId,
    setEditingLessonId,
    editingActivityId,
    setEditingActivityId,
    deletingModule,
    setDeletingModule,
    showDeleteModuleModal,
    setShowDeleteModuleModal,
    deletingLesson,
    setDeletingLesson,
    showDeleteLessonModal,
    setShowDeleteLessonModal,
    feedbackMessage,
    modules,
    modulesLoading,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    lessons,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    materials,
    createMaterial,
    activities,
    createActivity,
    updateActivity,
    user,
    workshopPreview,
    previewLoading,
    userStats,
    enrolledUsers,
    statsLoading,
    chartData,
    savingConfig,
    showTemplatePreview,
    setShowTemplatePreview,
    selectedCertificateTemplate,
    setSelectedCertificateTemplate,
    instructorSignatureUrl,
    instructorSignatureName,
    courseSkills,
    setCourseSkills,
    savingSkills,
    configData,
    setConfigData,
    showFeedbackMessage,
    handleConfigChange,
    handleSaveConfig,
    toggleModule,
    toggleLesson,
  } = useInstructorCourseManagementLogic({ courseId })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      {feedbackMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl border backdrop-blur-md transition-all duration-300 ${feedbackMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100'
                : 'bg-rose-500/15 border-rose-400/40 text-rose-100'
              }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-300 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {feedbackMessage.type === 'success' ? '¡Configuración guardada!' : 'No pudimos completar la acción'}
              </p>
              <p className="text-sm opacity-90">{feedbackMessage.message}</p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-purple-200 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver a Talleres
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Gestión de Curso</h1>
              <p className="text-purple-200/80">Administra módulos, lecciones, materiales y actividades</p>
            </div>
          </div>
        </div>

        {/* Tabs mínimos para instructor */}
        <div className="bg-gray-800/60 rounded-xl border border-purple-800/30 mb-6">
          <div className="flex p-1">
            {[
              { key: 'modules', label: 'Módulos', icon: Book },
              { key: 'config', label: 'Configuración', icon: Settings },
              { key: 'preview', label: 'Vista Previa', icon: Eye },
              { key: 'stats', label: 'Estadísticas', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all ${activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-purple-900/20'
                  }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de módulos */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedModule(null)
                  setShowModuleModal(true)
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Agregar Módulo</span>
              </button>
            </div>

            {modulesLoading ? (
              <div className="text-center py-20 text-purple-200">Cargando módulos...</div>
            ) : modules.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-purple-800/40 rounded-xl text-purple-200">
                No hay módulos aún
              </div>
            ) : (
              [...modules]
                .sort((a, b) => {
                  // Función para extraer número del módulo del título
                  const extractModuleNumber = (title: string): number => {
                    const match = title.match(/Módulo\s*(\d+)/i);
                    return match ? parseInt(match[1], 10) : 999;
                  };

                  const aNumber = extractModuleNumber(a.module_title);
                  const bNumber = extractModuleNumber(b.module_title);

                  // Si ambos tienen número en el título, priorizar ese número
                  if (aNumber !== 999 && bNumber !== 999) {
                    return aNumber - bNumber;
                  }

                  // Si solo uno tiene número, priorizarlo
                  if (aNumber !== 999 && bNumber === 999) return -1;
                  if (aNumber === 999 && bNumber !== 999) return 1;

                  // Si ninguno tiene número o ambos tienen, usar module_order_index
                  const orderDiff = (a.module_order_index || 0) - (b.module_order_index || 0);
                  if (orderDiff !== 0) return orderDiff;

                  // Último recurso: ordenar por título alfabéticamente
                  return a.module_title.localeCompare(b.module_title);
                })
                .map((module: AdminModule) => (
                  <div key={module.module_id} className="rounded-xl border border-purple-800/30 bg-gray-900/60 overflow-hidden">
                    <div className="p-6 flex items-center justify-between border-b border-purple-800/30">
                      <div className="flex items-center space-x-4 flex-1">
                        <button onClick={() => toggleModule(module.module_id)} className="text-purple-300 hover:text-white">
                          {expandedModules.has(module.module_id) ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                        </button>
                        <div>
                          <span className="font-bold text-white text-xl">{module.module_title}</span>
                          <div className="flex items-center space-x-3 mt-1 text-purple-200">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/30 text-green-300 border border-green-700/40">
                              {module.is_published ? '✓ Publicado' : '● Borrador'}
                            </span>
                            <span className="text-sm flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {module.module_duration_minutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedModule(module)
                            setShowModuleModal(true)
                          }}
                          className="px-4 py-2 bg-purple-900/30 hover:bg-purple-800/40 rounded-lg text-sm text-purple-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setDeletingModule(module)
                            setShowDeleteModuleModal(true)
                          }}
                          className="px-4 py-2 bg-red-900/30 hover:bg-red-800/40 rounded-lg text-sm text-red-200"
                          title="Eliminar módulo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingModuleId(module.module_id)
                            setSelectedLesson(null)
                            setShowLessonModal(true)
                          }}
                          className="p-3 bg-indigo-900/30 hover:bg-indigo-800/40 rounded-lg"
                          title="Agregar lección"
                        >
                          <Plus className="w-5 h-5 text-indigo-300" />
                        </button>
                      </div>
                    </div>

                    {expandedModules.has(module.module_id) && (
                      <div className="p-6">
                        {(lessons.filter((l: AdminLesson) => l.module_id === module.module_id).length === 0) ? (
                          <div className="text-center py-10 text-purple-200/80 border border-dashed border-purple-800/30 rounded-xl">
                            No hay lecciones aún
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {lessons.filter((l: AdminLesson) => l.module_id === module.module_id).map((lesson: AdminLesson) => (
                              <div key={lesson.lesson_id} className="rounded-xl border border-purple-800/30 bg-gray-900/40">
                                <div className="p-4 flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <button onClick={() => toggleLesson(lesson.lesson_id)} className="text-purple-300 hover:text-white">
                                      {expandedLessons.has(lesson.lesson_id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </button>
                                    <div>
                                      <div className="text-white font-semibold">{lesson.lesson_title}</div>
                                      <div className="text-xs text-purple-200 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" />{Math.floor(lesson.duration_seconds / 60)} min</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => {
                                        setSelectedLesson(lesson)
                                        setEditingModuleId(lesson.module_id)
                                        setShowLessonModal(true)
                                      }}
                                      className="px-3 py-2 bg-blue-900/30 hover:bg-blue-800/40 rounded-lg text-sm text-blue-200"
                                      title="Editar lección"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeletingLesson(lesson)
                                        setShowDeleteLessonModal(true)
                                      }}
                                      className="px-3 py-2 bg-red-900/30 hover:bg-red-800/40 rounded-lg text-sm text-red-200"
                                      title="Eliminar lección"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingLessonId(lesson.lesson_id)
                                        setShowMaterialModal(true)
                                      }}
                                      className="p-2.5 bg-indigo-900/30 hover:bg-indigo-800/40 rounded-lg"
                                      title="Agregar material"
                                    >
                                      <FileText className="w-5 h-5 text-indigo-300" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingLessonId(lesson.lesson_id)
                                        setShowActivityModal(true)
                                      }}
                                      className="p-2.5 bg-purple-900/30 hover:bg-purple-800/40 rounded-lg"
                                      title="Agregar actividad"
                                    >
                                      <ClipboardList className="w-5 h-5 text-purple-300" />
                                    </button>
                                  </div>
                                </div>

                                {expandedLessons.has(lesson.lesson_id) && (
                                  <div className="p-4 border-t border-purple-800/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-900/40 rounded-lg p-4 border border-purple-800/30">
                                      <div className="flex items-center justify-between mb-3 text-purple-200 font-semibold text-sm">
                                        <span>Materiales</span>
                                        <button
                                          onClick={() => {
                                            setEditingLessonId(lesson.lesson_id)
                                            setShowMaterialModal(true)
                                          }}
                                          className="text-xs text-indigo-300 hover:text-indigo-200"
                                        >
                                          + Agregar
                                        </button>
                                      </div>
                                      {(materials.filter((m: any) => m.lesson_id === lesson.lesson_id).length === 0) ? (
                                        <p className="text-xs text-purple-300/70">No hay materiales</p>
                                      ) : (
                                        <div className="space-y-2 text-xs text-purple-200">
                                          {materials.filter((m: any) => m.lesson_id === lesson.lesson_id).map((m: any) => (
                                            <div key={m.material_id} className="p-3 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                                              <div className="font-medium text-white">{m.material_title}</div>
                                              <div className="text-purple-300/80 mt-1">{m.material_type}</div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="bg-gray-900/40 rounded-lg p-4 border border-purple-800/30">
                                      <div className="flex items-center justify-between mb-3 text-purple-200 font-semibold text-sm">
                                        <span>Actividades</span>
                                        <button
                                          onClick={() => {
                                            setEditingLessonId(lesson.lesson_id)
                                            setShowActivityModal(true)
                                          }}
                                          className="text-xs text-purple-300 hover:text-purple-200"
                                        >
                                          + Agregar
                                        </button>
                                      </div>
                                      {(activities.filter((a: any) => a.lesson_id === lesson.lesson_id).length === 0) ? (
                                        <p className="text-xs text-purple-300/70">No hay actividades</p>
                                      ) : (
                                        <div className="space-y-2 text-xs">
                                          {activities.filter((a: any) => a.lesson_id === lesson.lesson_id).map((a: any) => (
                                            <div key={a.activity_id} className="p-3 rounded-lg bg-gray-900/60 border border-purple-700/40 flex items-center justify-between">
                                              <div>
                                                <div className="font-semibold text-white">{a.activity_title}</div>
                                                <div className="text-purple-200 mt-1">{a.activity_type}</div>
                                              </div>
                                              <button
                                                onClick={() => {
                                                  setEditingLessonId(lesson.lesson_id)
                                                  setEditingActivityId(a.activity_id)
                                                  setShowActivityModal(true)
                                                }}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white"
                                                title="Editar actividad"
                                              >
                                                <Edit3 className="w-4 h-4" />
                                                Editar
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {/* Configuración */}
        {activeTab === 'config' && (
          <div className="mt-6">
            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-2">Título *</label>
                  <input name="title" value={configData.title} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-2">Descripción *</label>
                  <textarea name="description" value={configData.description} onChange={handleConfigChange} rows={6} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Categoría *</label>
                    <select name="category" value={configData.category} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2">
                      <option value="ia">Inteligencia Artificial</option>
                      <option value="tecnologia">Tecnología</option>
                      <option value="negocios">Negocios</option>
                      <option value="diseño">Diseño</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Nivel *</label>
                    <select name="level" value={configData.level} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2">
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Duración (minutos) *</label>
                    <input type="number" name="duration_total_minutes" value={configData.duration_total_minutes} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                  </div>
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Precio</label>
                    <input type="number" step="0.01" name="price" value={configData.price} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                  </div>
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-2">Imagen del Curso</label>
                  <ImageUploadCourse
                    value={configData.thumbnail_url}
                    onChange={(url) => setConfigData(prev => ({ ...prev, thumbnail_url: url }))}
                    disabled={savingConfig}
                  />
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-2">Slug (URL)</label>
                  <input name="slug" value={configData.slug} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-4">
                    Skills que se Aprenden en este Curso
                  </label>
                  <p className="text-xs text-purple-300/70 mb-4">
                    Selecciona las skills que los estudiantes obtendrán al completar este curso. Estas aparecerán en su perfil.
                  </p>
                  <CourseSkillsSelector
                    courseId={courseId}
                    selectedSkills={courseSkills}
                    onSkillsChange={setCourseSkills}
                    disabled={savingConfig || savingSkills}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <div className="text-purple-200 font-semibold mb-3">Acciones</div>
                  <button type="submit" disabled={savingConfig} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-60">
                    {savingConfig ? 'Guardando...' : 'Guardar configuración'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}



        {/* Vista previa */}
        {activeTab === 'preview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full mb-4"
                />
                <p className="text-[#6C757D] dark:text-white/60 text-sm font-medium">Cargando vista previa...</p>
              </div>
            ) : workshopPreview ? (
              <div className="space-y-6">
                {/* Header con imagen destacada */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative group"
                >
                  <div className="relative rounded-2xl overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] shadow-lg hover:shadow-2xl transition-all duration-500">
                    {/* Imagen de portada con overlay */}
                    <div className="relative h-80 overflow-hidden">
                      {workshopPreview.thumbnail_url ? (
                        <>
                          <motion.img
                            src={workshopPreview.thumbnail_url}
                            alt={workshopPreview.title}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.6 }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/90 via-[#0A2540]/40 to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0A2540] via-[#0A2540]/90 to-[#00D4B3]/20 flex items-center justify-center">
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="text-[#00D4B3]/30 text-9xl"
                          >
                            📚
                          </motion.div>
                        </div>
                      )}

                      {/* Badge de categoría */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute top-6 left-6"
                      >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4B3]/90 backdrop-blur-md text-white text-sm font-semibold shadow-lg">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          {workshopPreview.category || 'Curso'}
                        </span>
                      </motion.div>

                      {/* Badge de nivel */}
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="absolute top-6 right-6"
                      >
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md text-white text-sm font-semibold shadow-lg ${workshopPreview.level === 'beginner' ? 'bg-[#10B981]/90' :
                            workshopPreview.level === 'intermediate' ? 'bg-[#F59E0B]/90' :
                              'bg-[#0A2540]/90'
                          }`}>
                          {workshopPreview.level === 'beginner' ? '🌱 Principiante' :
                            workshopPreview.level === 'intermediate' ? '📈 Intermedio' :
                              '🚀 Avanzado'}
                        </span>
                      </motion.div>

                      {/* Título sobre la imagen */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-0 left-0 right-0 p-8"
                      >
                        <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl">
                          {workshopPreview.title}
                        </h1>
                        <p className="text-white/90 text-lg leading-relaxed drop-shadow-lg line-clamp-2">
                          {workshopPreview.description}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Grid de información y detalles */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Columna principal - Detalles del curso */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2 space-y-6"
                  >
                    {/* Descripción completa */}
                    <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                          <Book className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Sobre este curso</h2>
                      </div>
                      <p className="text-[#6C757D] dark:text-white/70 leading-relaxed text-base">
                        {workshopPreview.description}
                      </p>
                    </div>

                    {/* Estadísticas del curso */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          icon: '⏱️',
                          label: 'Duración',
                          value: `${workshopPreview.duration_total_minutes} min`,
                          color: 'from-[#00D4B3] to-[#10B981]'
                        },
                        {
                          icon: '📊',
                          label: 'Nivel',
                          value: workshopPreview.level === 'beginner' ? 'Principiante' :
                            workshopPreview.level === 'intermediate' ? 'Intermedio' : 'Avanzado',
                          color: 'from-[#0A2540] to-[#00D4B3]'
                        },
                        {
                          icon: '🎯',
                          label: 'Categoría',
                          value: workshopPreview.category || 'General',
                          color: 'from-[#10B981] to-[#00D4B3]'
                        },
                        {
                          icon: '💰',
                          label: 'Precio',
                          value: workshopPreview.price > 0 ? `$${workshopPreview.price}` : 'Gratis',
                          color: 'from-[#F59E0B] to-[#10B981]'
                        }
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                          className="relative group"
                        >
                          <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                            <div className="relative">
                              <div className="text-3xl mb-2">{stat.icon}</div>
                              <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide mb-1">
                                {stat.label}
                              </div>
                              <div className="text-lg font-bold text-[#0A2540] dark:text-white">
                                {stat.value}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Sidebar - Acciones y detalles adicionales */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-4"
                  >
                    {/* Card de acciones */}
                    <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm sticky top-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4B3] to-[#10B981] flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Vista Previa</h3>
                        </div>

                        {/* Botón principal */}
                        <motion.button
                          onClick={() => {
                            if (workshopPreview.slug) window.open(`/courses/${workshopPreview.slug}`, '_blank')
                          }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative w-full px-6 py-4 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#0A2540]/20 hover:shadow-xl hover:shadow-[#0A2540]/30 transition-all duration-300 overflow-hidden font-semibold"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <Eye className="w-5 h-5 relative z-10" />
                          <span className="relative z-10">Ver Página Pública</span>
                        </motion.button>

                        {/* Información adicional */}
                        <div className="pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#6C757D] dark:text-white/60">Estado</span>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] text-xs font-semibold">
                              <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                              Publicado
                            </span>
                          </div>

                          {workshopPreview.slug && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#6C757D] dark:text-white/60">URL</span>
                              <code className="px-2 py-1 rounded bg-[#E9ECEF] dark:bg-[#0A0D12] text-[#00D4B3] text-xs font-mono">
                                /{workshopPreview.slug}
                              </code>
                            </div>
                          )}
                        </div>

                        {/* Tip */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="mt-6 p-4 rounded-xl bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 border border-[#00D4B3]/20"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00D4B3]/20 flex items-center justify-center">
                              <span className="text-lg">💡</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#0A2540] dark:text-white mb-1">
                                Vista Previa en Tiempo Real
                              </p>
                              <p className="text-xs text-[#6C757D] dark:text-white/60 leading-relaxed">
                                Esta es una vista previa de cómo se verá tu curso para los estudiantes.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1E2329] rounded-2xl border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A2540]/10 to-[#00D4B3]/10 dark:from-[#0A2540]/20 dark:to-[#00D4B3]/20 flex items-center justify-center mb-6">
                  <Eye className="w-10 h-10 text-[#6C757D] dark:text-white/40" />
                </div>
                <p className="text-[#0A2540] dark:text-white text-lg font-semibold mb-2">No se encontró el curso</p>
                <p className="text-[#6C757D] dark:text-white/60 text-sm">Guarda la configuración primero para ver la vista previa</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Estadísticas */}
        {activeTab === 'stats' && (
          <div className="mt-6 space-y-6">
            {statsLoading ? (
              <div className="text-center py-20 text-purple-200">Cargando estadísticas...</div>
            ) : (
              <>
                {/* Estadísticas del Curso */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-purple-300" />
                    Estadísticas del Curso
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Módulos</div>
                      <div className="text-3xl font-bold text-white">{modules.length}</div>
                      <div className="text-xs text-purple-400/60 mt-1">{modules.filter((m: AdminModule) => m.is_published).length} publicados</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Lecciones</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_lessons ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Duración total</div>
                      <div className="text-3xl font-bold text-white">{modules.reduce((acc: number, m: AdminModule) => acc + (m.module_duration_minutes || 0), 0)} min</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Materiales</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_materials ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Actividades</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_activities ?? '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">{userStats?.completed_activities ?? 0} completadas</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Notas creadas</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_notes ?? '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas de Usuarios */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-purple-300" />
                    Estadísticas de Usuarios
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Usuarios inscritos</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_enrolled ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">En progreso</div>
                      <div className="text-3xl font-bold text-white">{userStats?.in_progress ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Completados</div>
                      <div className="text-3xl font-bold text-white">{userStats?.completed ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">No iniciados</div>
                      <div className="text-3xl font-bold text-white">{userStats?.not_started ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Progreso promedio</div>
                      <div className="text-3xl font-bold text-white">{userStats ? `${Math.round(userStats.average_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Activos últimos 7 días</div>
                      <div className="text-3xl font-bold text-white">{userStats?.active_7d ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Activos últimos 30 días</div>
                      <div className="text-3xl font-bold text-white">{userStats?.active_30d ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Certificados emitidos</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_certificates ?? '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas Financieras */}
                {(userStats?.total_purchases > 0 || userStats?.total_revenue_cents > 0) && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-300" />
                      Estadísticas Financieras
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                        <div className="text-sm text-purple-300/80 mb-2">Compras totales</div>
                        <div className="text-3xl font-bold text-white">{userStats?.total_purchases ?? '—'}</div>
                        <div className="text-xs text-purple-400/60 mt-1">{userStats?.active_purchases ?? 0} activas</div>
                      </div>
                      <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                        <div className="text-sm text-purple-300/80 mb-2">Ingresos totales</div>
                        <div className="text-3xl font-bold text-green-400">{userStats?.total_revenue_display ?? '$0.00'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estadísticas de Reseñas */}
                {userStats?.total_reviews > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-300" />
                      Reseñas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                        <div className="text-sm text-purple-300/80 mb-2">Total de reseñas</div>
                        <div className="text-3xl font-bold text-white">{userStats?.total_reviews ?? '—'}</div>
                      </div>
                      <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                        <div className="text-sm text-purple-300/80 mb-2">Calificación promedio</div>
                        <div className="text-3xl font-bold text-yellow-400">{userStats?.average_rating ? `${userStats.average_rating.toFixed(1)} ⭐` : '—'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Análisis Estadístico Profundo */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <Sigma className="w-5 h-5 text-purple-300" />
                    Análisis Estadístico Profundo
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Mediana de Progreso</div>
                      <div className="text-2xl font-bold text-white">{userStats?.median_progress ? `${Math.round(userStats.median_progress)}%` : '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Valor central</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Desviación Estándar</div>
                      <div className="text-2xl font-bold text-white">{userStats?.std_deviation ?? '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Dispersión de datos</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Rango Intercuartílico</div>
                      <div className="text-2xl font-bold text-white">{userStats?.iqr_progress ? `${Math.round(userStats.iqr_progress)}%` : '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Q3 - Q1</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Rango Total</div>
                      <div className="text-2xl font-bold text-white">
                        {userStats?.min_progress !== undefined && userStats?.max_progress !== undefined
                          ? `${Math.round(userStats.min_progress)}% - ${Math.round(userStats.max_progress)}%`
                          : '—'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Primer Cuartil (Q1)</div>
                      <div className="text-2xl font-bold text-white">{userStats?.q1_progress ? `${Math.round(userStats.q1_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tercer Cuartil (Q3)</div>
                      <div className="text-2xl font-bold text-white">{userStats?.q3_progress ? `${Math.round(userStats.q3_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Varianza</div>
                      <div className="text-2xl font-bold text-white">{userStats?.variance ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tiempo Promedio de Finalización</div>
                      <div className="text-2xl font-bold text-white">{userStats?.avg_completion_days ? `${Math.round(userStats.avg_completion_days)} días` : '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Métricas de RRHH */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-300" />
                    Métricas de RRHH
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tasa de Retención</div>
                      <div className="text-3xl font-bold text-green-400">{userStats?.retention_rate ? `${userStats.retention_rate.toFixed(1)}%` : '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Usuarios activos últimos 30 días</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tasa de Finalización</div>
                      <div className="text-3xl font-bold text-blue-400">{userStats?.completion_rate ? `${userStats.completion_rate.toFixed(1)}%` : '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Completados / Inscritos</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tasa de Abandono</div>
                      <div className="text-3xl font-bold text-red-400">
                        {userStats?.retention_rate !== undefined
                          ? `${(100 - userStats.retention_rate).toFixed(1)}%`
                          : '—'}
                      </div>
                      <div className="text-xs text-purple-400/60 mt-1">Usuarios inactivos</div>
                    </div>
                  </div>
                </div>

                {/* Gráficas Avanzadas */}
                {chartData && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5 text-purple-300" />
                      Visualizaciones Avanzadas
                    </h2>

                    {/* Gráfica de Tendencia de Inscripciones */}
                    {chartData.enrollment_trend && chartData.enrollment_trend.length > 0 && (
                      <EnrollmentTrendChart data={chartData.enrollment_trend} />
                    )}

                    {/* Gráfica de Distribución de Progreso */}
                    {chartData.progress_distribution && chartData.progress_distribution.length > 0 && (
                      <ProgressDistributionChart data={chartData.progress_distribution} />
                    )}

                    {/* Gráfica de Dispersión: Engagement */}
                    {chartData.engagement_data && chartData.engagement_data.length > 0 && (
                      <EngagementScatterChart data={chartData.engagement_data} />
                    )}

                    {/* Gráfica de Tasas de RRHH */}
                    {chartData.enrollment_rates && chartData.enrollment_rates.length > 0 && (
                      <CompletionRateChart data={chartData.enrollment_rates} />
                    )}

                    {/* Gráficas de pastel: Roles y Áreas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {chartData.user_roles_pie && chartData.user_roles_pie.length > 0 && (
                        <DonutPieChart data={chartData.user_roles_pie} title="Distribución por Rol" />
                      )}
                      {chartData.user_areas_pie && chartData.user_areas_pie.length > 0 && (
                        <DonutPieChart data={chartData.user_areas_pie} title="Distribución por Área" />
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de Usuarios Inscritos */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-purple-300" />
                    Lista de Usuarios Inscritos
                  </h2>
                  {enrolledUsers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-purple-800/40 rounded-xl text-purple-200">
                      No hay usuarios inscritos aún
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-purple-900/30">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Usuario</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Estado</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Progreso</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Inscrito</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Última actividad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-800/30">
                            {enrolledUsers.map((user: any) => (
                              <tr key={user.enrollment_id} className="hover:bg-purple-900/10 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    {user.profile_picture ? (
                                      <img src={user.profile_picture} alt={user.display_name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-purple-700/40 flex items-center justify-center text-purple-200 font-semibold">
                                        {user.display_name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-white font-medium">{user.display_name}</div>
                                      <div className="text-xs text-purple-300/70">{user.email || user.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.enrollment_status === 'completed' ? 'bg-green-900/30 text-green-300 border border-green-700/40' :
                                      user.enrollment_status === 'active' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/40' :
                                        'bg-gray-800/50 text-gray-300 border border-gray-700/40'
                                    }`}>
                                    {user.enrollment_status === 'completed' ? 'Completado' :
                                      user.enrollment_status === 'active' ? 'Activo' :
                                        user.enrollment_status === 'paused' ? 'Pausado' :
                                          user.enrollment_status === 'cancelled' ? 'Cancelado' : 'Desconocido'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-1 bg-purple-900/30 rounded-full h-2 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all"
                                        style={{ width: `${user.progress_percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-purple-200 font-medium w-12 text-right">
                                      {Math.round(user.progress_percentage)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-purple-200">
                                  {user.enrolled_at ? new Date(user.enrolled_at).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-6 py-4 text-sm text-purple-200">
                                  {user.last_accessed_at ? new Date(user.last_accessed_at).toLocaleString() : 'Nunca'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {showModuleModal && (
          <ModuleModal
            module={selectedModule}
            onClose={() => {
              setShowModuleModal(false)
              setSelectedModule(null)
            }}
            onSave={async (data: any) => {
              if (selectedModule) await updateModule(courseId, selectedModule.module_id, data)
              else await createModule(courseId, data)
              setShowModuleModal(false)
            }}
          />
        )}

        {showDeleteModuleModal && deletingModule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar el módulo "{deletingModule.module_title}"?
                Esta acción no se puede deshacer y eliminará todas las lecciones asociadas.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModuleModal(false)
                    setDeletingModule(null)
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteModule(courseId, deletingModule.module_id)
                      await fetchModules(courseId) // Recargar módulos después de eliminar
                      setShowDeleteModuleModal(false)
                      setDeletingModule(null)
                    } catch (error) {
                      showFeedbackMessage('error', 'No se pudo eliminar el módulo')
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteLessonModal && deletingLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar la lección "{deletingLesson.lesson_title}"?
                Esta acción no se puede deshacer y eliminará todos los materiales y actividades asociados.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteLessonModal(false)
                    setDeletingLesson(null)
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteLesson(deletingLesson.lesson_id, courseId)
                      // Recargar lecciones del módulo después de eliminar
                      if (deletingLesson.module_id) {
                        await fetchLessons(deletingLesson.module_id, courseId)
                      }
                      setShowDeleteLessonModal(false)
                      setDeletingLesson(null)
                    } catch (error) {
                      showFeedbackMessage('error', 'No se pudo eliminar la lección')
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {showLessonModal && editingModuleId && (
          <LessonModal
            moduleId={editingModuleId}
            lesson={selectedLesson}
            onClose={() => {
              setShowLessonModal(false)
              setSelectedLesson(null)
              setEditingModuleId(null)
            }}
            onSave={async (data: any) => {
              if (selectedLesson) {
                await updateLesson(selectedLesson.lesson_id, data, courseId)
                // Recargar lecciones del módulo después de actualizar
                if (selectedLesson.module_id) {
                  await fetchLessons(selectedLesson.module_id, courseId)
                }
              } else {
                await createLesson(editingModuleId, data, courseId)
                // Recargar lecciones del módulo después de crear
                await fetchLessons(editingModuleId, courseId)
              }
              setShowLessonModal(false)
              setSelectedLesson(null)
              setEditingModuleId(null)
            }}
            instructors={user ? [{ id: (user as any).id, name: (user as any).display_name || (user as any).username || (user as any).email }] : []}
          />
        )}

        {showMaterialModal && editingLessonId && (() => {
          const lesson = lessons.find((l: AdminLesson) => l.lesson_id === editingLessonId)
          if (!lesson || !lesson.module_id) return null
          return (
            <MaterialModal
              material={null}
              lessonId={editingLessonId}
              onClose={() => {
                setShowMaterialModal(false)
                setEditingLessonId(null)
              }}
              onSave={async (data: any) => {
                await createMaterial(editingLessonId, courseId, lesson.module_id, data)
                setShowMaterialModal(false)
                setEditingLessonId(null)
              }}
            />
          )
        })()}

        {showActivityModal && editingLessonId && (() => {
          const lesson = lessons.find((l: AdminLesson) => l.lesson_id === editingLessonId)
          if (!lesson || !lesson.module_id) return null
          return (
            <ActivityModal
              activity={editingActivityId ? activities.find((a: any) => a.activity_id === editingActivityId) || null : null}
              lessonId={editingLessonId}
              onClose={() => {
                setShowActivityModal(false)
                setEditingLessonId(null)
                setEditingActivityId(null)
              }}
              onSave={async (data: any) => {
                if (editingActivityId) {
                  await updateActivity(editingActivityId, courseId, lesson.module_id, editingLessonId, data)
                } else {
                  await createActivity(editingLessonId, courseId, lesson.module_id, data)
                }
                setShowActivityModal(false)
                setEditingLessonId(null)
                setEditingActivityId(null)
              }}
            />
          )
        })()}

        {/* Modal de Preview de Plantillas de Certificados */}
        <CertificateTemplatePreview
          key={`cert-preview-${instructorSignatureName || 'no-name'}-${instructorSignatureUrl || 'no-url'}`}
          isOpen={showTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
          selectedTemplate={selectedCertificateTemplate}
          onSelectTemplate={(templateId: string) => {
            setSelectedCertificateTemplate(templateId)
          }}
          instructorSignatureUrl={instructorSignatureUrl}
          instructorSignatureName={instructorSignatureName}
          instructorDisplayName={workshopPreview?.instructor_name || user?.display_name || (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username) || undefined}
          studentName={workshopPreview?.title ? 'Estudiante Ejemplo' : undefined}
          courseName={workshopPreview?.title || undefined}
          issueDate={new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        />
      </div>
    </div>
  )
}

export default InstructorCourseManagementPage
