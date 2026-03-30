'use client'

import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { ArrowLeft, Plus, ChevronDown, ChevronRight, GripVertical, Book, FileText, ClipboardList, Flag, Clock, BarChart3, LayoutDashboard, Users2, DollarSign, Star, Sigma, Briefcase, LineChart as LineChartIcon, ListChecks, Pencil, Trash2, Settings, Eye, Award, CheckCircle2, AlertTriangle, TrendingUp, Rocket, Target, Lightbulb, Sprout, RefreshCw, ArrowRightLeft } from 'lucide-react'
import { BarChart, Bar, AreaChart, Area, RadialBarChart, RadialBar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { EnrollmentTrendChart, ProgressDistributionChart, EngagementScatterChart, CompletionRateChart, DonutPieChart } from './AdvancedCharts'
import { AdminModule } from '../services/adminModules.service'
import { AdminLesson } from '../services/adminLessons.service'
import { ModuleModal } from './ModuleModal'
import { LessonModal } from './LessonModal'
import { MaterialModal } from './MaterialModal'
import { ActivityModal } from './ActivityModal'
import { ImageUploadCourse } from '@/features/instructor/components/ImageUploadCourse'
import { CertificateTemplatePreview } from './CertificateTemplatePreview'
import { InstructorSignatureUpload } from '@/features/instructor/components/InstructorSignatureUpload'
import { CourseSkillsSelector, CourseSkill } from '@/features/courses/components/CourseSkillsSelector'
import { useCourseManagementLogic } from './CourseManagement/hooks/useCourseManagementLogic'
import { CourseModulesTab } from './CourseManagement/CourseModulesTab'
import { CourseConfigTab } from './CourseManagement/CourseConfigTab'
import { CoursePreviewTab } from './CourseManagement/CoursePreviewTab'
import { CourseStatsTab } from './CourseManagement/CourseStatsTab'

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}min`
}

interface CourseManagementPageProps {
  courseId: string
}

export function CourseManagementPage({ courseId }: CourseManagementPageProps) {
  const {
    isNewCourse,
    router,
    showFeedbackMessage,
    activeTab, setActiveTab,
    expandedModules, expandedLessons, toggleModule, toggleLesson,
    showModuleModal, setShowModuleModal,
    showLessonModal, setShowLessonModal,
    showMaterialModal, setShowMaterialModal,
    showActivityModal, setShowActivityModal,
    showMoveLessonModal, setShowMoveLessonModal,
    showTemplatePreview, setShowTemplatePreview,
    showStudentDetailsModal, setShowStudentDetailsModal,
    feedbackMessage,
    selectedModule, setSelectedModule,
    selectedLesson, setSelectedLesson,
    editingModuleId, setEditingModuleId,
    editingLessonId, setEditingLessonId,
    editingMaterial, setEditingMaterial,
    editingActivity, setEditingActivity,
    movingLesson, setMovingLesson,
    instructors, userStats, enrolledUsers, statsLoading, chartData,
    workshopPreview, previewLoading,
    savingConfig, configData, setConfigData, handleConfigChange, handleSaveConfig,
    selectedCertificateTemplate, setSelectedCertificateTemplate,
    instructorSignatureUrl, instructorSignatureName,
    courseSkills, setCourseSkills, savingSkills,
    selectedStudent, setSelectedStudent,
    studentDetailsData, setStudentDetailsData,
    loadingStudentDetails, loadStudentDetails,
    recalculatingDurations, setRecalculatingDurations, orderedModules, orderedLessons,
    handleModulesReorder, handleLessonsReorder, handleRecalculateDurations,
    handleCreateModule, handleEditModule, handleDeleteModule,
    handleCreateLesson, handleDeleteLesson, handleMoveLessonToModule,
    modules, modulesLoading, fetchModules,
    lessons, lessonsLoading, fetchLessons,
    materials, fetchMaterials, createMaterial, updateMaterial, deleteMaterial, getMaterialsByLesson,
    fetchActivities, createActivity, updateActivity, deleteActivity, getActivitiesByLesson,
    updateLesson,
    getModuleLessons, getLessonMaterials, getLessonActivities,
  } = useCourseManagementLogic(courseId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9ECEF] via-white to-[#E9ECEF]/50 dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
      {/* Feedback Toast Mejorado */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-6 right-6 z-50"
          >
            <div
              className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl border backdrop-blur-md ${feedbackMessage.type === 'success'
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] dark:bg-[#10B981]/20 dark:border-[#10B981]/40 dark:text-[#10B981]'
                : 'bg-red-500/10 border-red-400/30 text-red-600 dark:bg-red-500/20 dark:border-red-400/40 dark:text-red-400'
                }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {feedbackMessage.type === 'success' ? '¡Configuración guardada!' : 'Ocurrió un problema'}
                </p>
                <p className="text-xs opacity-90 mt-0.5">{feedbackMessage.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Rediseñado con Paleta SOFLIA */}
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
            className="inline-flex items-center text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform" />
            <span className="text-sm font-medium">Volver a Talleres</span>
          </motion.button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white mb-2">
                {isNewCourse ? 'Crear Nuevo Curso' : 'Gestión de Curso'}
              </h1>
              <p className="text-[#6C757D] dark:text-white/60 text-sm">
                Administra módulos, lecciones, materiales y actividades
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs Rediseñados con Paleta SOFLIA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-[#1E2329] rounded-xl shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 mb-6 p-1.5"
        >
          <div className="flex gap-1.5">
            {[
              { key: 'modules', label: 'Módulos', icon: Book },
              { key: 'config', label: 'Configuración', icon: Settings },
              { key: 'preview', label: 'Vista Previa', icon: Eye },
              { key: 'stats', label: 'Estadísticas', icon: BarChart3 }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => !isNewCourse && setActiveTab(tab.key as any)}
                disabled={isNewCourse && tab.key !== 'config'}
                whileHover={{ scale: (isNewCourse && tab.key !== 'config') ? 1 : 1.02 }}
                whileTap={{ scale: (isNewCourse && tab.key !== 'config') ? 1 : 0.98 }}
                className={`relative flex-1 py-2.5 px-4 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 ${activeTab === tab.key
                  ? 'text-white'
                  : (isNewCourse && tab.key !== 'config')
                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                    : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white'
                  }`}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 rounded-lg shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <tab.icon className={`w-3.5 h-3.5 relative z-10 ${activeTab === tab.key ? 'text-white' : ''}`} />
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'modules' && (
            <CourseModulesTab
              key="modules"
              courseId={courseId}
              {...{
                isNewCourse, router, showFeedbackMessage, activeTab, setActiveTab,
                expandedModules, expandedLessons, toggleModule, toggleLesson,
                showModuleModal, setShowModuleModal, showLessonModal, setShowLessonModal,
                showMaterialModal, setShowMaterialModal, showActivityModal, setShowActivityModal,
                showMoveLessonModal, setShowMoveLessonModal, showTemplatePreview, setShowTemplatePreview,
                showStudentDetailsModal, setShowStudentDetailsModal,
                feedbackMessage, selectedModule, setSelectedModule, selectedLesson, setSelectedLesson,
                editingModuleId, setEditingModuleId, editingLessonId, setEditingLessonId,
                editingMaterial, setEditingMaterial, editingActivity, setEditingActivity,
                movingLesson, setMovingLesson,
                instructors, userStats, enrolledUsers, statsLoading, chartData,
                workshopPreview, previewLoading,
                savingConfig, configData, setConfigData, handleConfigChange, handleSaveConfig,
                selectedCertificateTemplate, setSelectedCertificateTemplate,
                instructorSignatureUrl, instructorSignatureName,
                courseSkills, setCourseSkills, savingSkills,
                selectedStudent, setSelectedStudent, studentDetailsData, setStudentDetailsData,
                loadingStudentDetails, loadStudentDetails,
                recalculatingDurations, setRecalculatingDurations, orderedModules, orderedLessons,
                handleModulesReorder, handleLessonsReorder, handleRecalculateDurations,
                handleCreateModule, handleEditModule, handleDeleteModule,
                handleCreateLesson, handleDeleteLesson, handleMoveLessonToModule,
                modules, modulesLoading, fetchModules,
                lessons, lessonsLoading, fetchLessons,
                materials, fetchMaterials, createMaterial, updateMaterial, deleteMaterial, getMaterialsByLesson,
                fetchActivities, createActivity, updateActivity, deleteActivity, getActivitiesByLesson,
                updateLesson, getModuleLessons, getLessonMaterials, getLessonActivities,
              }}
            />
          )}
        </AnimatePresence>

        {/* Configuración */}
        <AnimatePresence mode="wait">
          {activeTab === 'config' && (
            <CourseConfigTab
              key="config"
              {...{
                isNewCourse, router, showFeedbackMessage, activeTab, setActiveTab,
                expandedModules, expandedLessons, toggleModule, toggleLesson,
                showModuleModal, setShowModuleModal, showLessonModal, setShowLessonModal,
                showMaterialModal, setShowMaterialModal, showActivityModal, setShowActivityModal,
                showMoveLessonModal, setShowMoveLessonModal, showTemplatePreview, setShowTemplatePreview,
                showStudentDetailsModal, setShowStudentDetailsModal,
                feedbackMessage, selectedModule, setSelectedModule, selectedLesson, setSelectedLesson,
                editingModuleId, setEditingModuleId, editingLessonId, setEditingLessonId,
                editingMaterial, setEditingMaterial, editingActivity, setEditingActivity,
                movingLesson, setMovingLesson,
                instructors, userStats, enrolledUsers, statsLoading, chartData,
                workshopPreview, previewLoading,
                savingConfig, configData, setConfigData, handleConfigChange, handleSaveConfig,
                selectedCertificateTemplate, setSelectedCertificateTemplate,
                instructorSignatureUrl, instructorSignatureName,
                courseSkills, setCourseSkills, savingSkills,
                selectedStudent, setSelectedStudent, studentDetailsData, setStudentDetailsData,
                loadingStudentDetails, loadStudentDetails,
                recalculatingDurations, setRecalculatingDurations, orderedModules, orderedLessons,
                handleModulesReorder, handleLessonsReorder, handleRecalculateDurations,
                handleCreateModule, handleEditModule, handleDeleteModule,
                handleCreateLesson, handleDeleteLesson, handleMoveLessonToModule,
                modules, modulesLoading, fetchModules,
                lessons, lessonsLoading, fetchLessons,
                materials, fetchMaterials, createMaterial, updateMaterial, deleteMaterial, getMaterialsByLesson,
                fetchActivities, createActivity, updateActivity, deleteActivity, getActivitiesByLesson,
                updateLesson, getModuleLessons, getLessonMaterials, getLessonActivities,
              }}
            />
          )}
        </AnimatePresence>

        {/* Vista Previa */}
        <AnimatePresence mode="wait">
          {activeTab === 'preview' && (
            <CoursePreviewTab
              key="preview"
              {...{
                isNewCourse, router, showFeedbackMessage, activeTab, setActiveTab,
                expandedModules, expandedLessons, toggleModule, toggleLesson,
                showModuleModal, setShowModuleModal, showLessonModal, setShowLessonModal,
                showMaterialModal, setShowMaterialModal, showActivityModal, setShowActivityModal,
                showMoveLessonModal, setShowMoveLessonModal, showTemplatePreview, setShowTemplatePreview,
                showStudentDetailsModal, setShowStudentDetailsModal,
                feedbackMessage, selectedModule, setSelectedModule, selectedLesson, setSelectedLesson,
                editingModuleId, setEditingModuleId, editingLessonId, setEditingLessonId,
                editingMaterial, setEditingMaterial, editingActivity, setEditingActivity,
                movingLesson, setMovingLesson,
                instructors, userStats, enrolledUsers, statsLoading, chartData,
                workshopPreview, previewLoading,
                savingConfig, configData, setConfigData, handleConfigChange, handleSaveConfig,
                selectedCertificateTemplate, setSelectedCertificateTemplate,
                instructorSignatureUrl, instructorSignatureName,
                courseSkills, setCourseSkills, savingSkills,
                selectedStudent, setSelectedStudent, studentDetailsData, setStudentDetailsData,
                loadingStudentDetails, loadStudentDetails,
                recalculatingDurations, setRecalculatingDurations, orderedModules, orderedLessons,
                handleModulesReorder, handleLessonsReorder, handleRecalculateDurations,
                handleCreateModule, handleEditModule, handleDeleteModule,
                handleCreateLesson, handleDeleteLesson, handleMoveLessonToModule,
                modules, modulesLoading, fetchModules,
                lessons, lessonsLoading, fetchLessons,
                materials, fetchMaterials, createMaterial, updateMaterial, deleteMaterial, getMaterialsByLesson,
                fetchActivities, createActivity, updateActivity, deleteActivity, getActivitiesByLesson,
                updateLesson, getModuleLessons, getLessonMaterials, getLessonActivities,
              }}
            />
          )}
        </AnimatePresence>

        {/* Estadísticas */}
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <CourseStatsTab
              key="stats"
              {...{
                isNewCourse, router, showFeedbackMessage, activeTab, setActiveTab,
                expandedModules, expandedLessons, toggleModule, toggleLesson,
                showModuleModal, setShowModuleModal, showLessonModal, setShowLessonModal,
                showMaterialModal, setShowMaterialModal, showActivityModal, setShowActivityModal,
                showMoveLessonModal, setShowMoveLessonModal, showTemplatePreview, setShowTemplatePreview,
                showStudentDetailsModal, setShowStudentDetailsModal,
                feedbackMessage, selectedModule, setSelectedModule, selectedLesson, setSelectedLesson,
                editingModuleId, setEditingModuleId, editingLessonId, setEditingLessonId,
                editingMaterial, setEditingMaterial, editingActivity, setEditingActivity,
                movingLesson, setMovingLesson,
                instructors, userStats, enrolledUsers, statsLoading, chartData,
                workshopPreview, previewLoading,
                savingConfig, configData, setConfigData, handleConfigChange, handleSaveConfig,
                selectedCertificateTemplate, setSelectedCertificateTemplate,
                instructorSignatureUrl, instructorSignatureName,
                courseSkills, setCourseSkills, savingSkills,
                selectedStudent, setSelectedStudent, studentDetailsData, setStudentDetailsData,
                loadingStudentDetails, loadStudentDetails,
                recalculatingDurations, setRecalculatingDurations, orderedModules, orderedLessons,
                handleModulesReorder, handleLessonsReorder, handleRecalculateDurations,
                handleCreateModule, handleEditModule, handleDeleteModule,
                handleCreateLesson, handleDeleteLesson, handleMoveLessonToModule,
                modules, modulesLoading, fetchModules,
                lessons, lessonsLoading, fetchLessons,
                materials, fetchMaterials, createMaterial, updateMaterial, deleteMaterial, getMaterialsByLesson,
                fetchActivities, createActivity, updateActivity, deleteActivity, getActivitiesByLesson,
                updateLesson, getModuleLessons, getLessonMaterials, getLessonActivities,
              }}
            />
          )}
        </AnimatePresence>

        {/* Modales */}
        {showModuleModal && (
          <ModuleModal
            module={selectedModule}
            onClose={() => {
              setShowModuleModal(false)
              setSelectedModule(null)
            }}
            onSave={async (data) => {
              if (selectedModule) {
                await handleEditModule(selectedModule.module_id, data)
              } else {
                await handleCreateModule(data)
              }
              setShowModuleModal(false)
            }}
          />
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
            onSave={async (data) => {
              try {
                if (selectedLesson) {
                  // Editar lección existente
                  await updateLesson(selectedLesson.lesson_id, data, courseId)
                  await fetchLessons(editingModuleId, courseId)
                } else {
                  // Crear nueva lección
                  await handleCreateLesson(data)
                }
                // Solo cerrar el modal si no hay errores
                setShowLessonModal(false)
                setSelectedLesson(null)
                setEditingModuleId(null)
              } catch (error) {
                // El error ya fue manejado en handleCreateLesson o updateLesson
                // No cerrar el modal para que el usuario pueda corregir
                throw error
              }
            }}
            instructors={instructors}
          />
        )}

        {showMaterialModal && editingLessonId && (
          <MaterialModal
            material={editingMaterial}
            lessonId={editingLessonId}
            onClose={() => {
              setShowMaterialModal(false)
              setEditingLessonId(null)
              setEditingMaterial(null)
            }}
            onSave={async (data) => {
              if (editingMaterial) {
                // Editar material existente
                await updateMaterial(editingMaterial.material_id, data)
                await fetchMaterials(editingLessonId)
              } else {
                // Crear nuevo material
                await createMaterial(editingLessonId, data)
                await fetchMaterials(editingLessonId)
              }
              setShowMaterialModal(false)
              setEditingLessonId(null)
              setEditingMaterial(null)
            }}
          />
        )}

        {showActivityModal && editingLessonId && (
          <ActivityModal
            activity={editingActivity}
            lessonId={editingLessonId}
            onClose={() => {
              setShowActivityModal(false)
              setEditingLessonId(null)
              setEditingActivity(null)
            }}
            onSave={async (data) => {
              if (editingActivity) {
                // Editar actividad existente
                await updateActivity(editingActivity.activity_id, data)
                await fetchActivities(editingLessonId)
              } else {
                // Crear nueva actividad
                await createActivity(editingLessonId, data)
                await fetchActivities(editingLessonId)
              }
              setShowActivityModal(false)
              setEditingLessonId(null)
              setEditingActivity(null)
            }}
          />
        )}

        {/* Modal de Preview de Plantillas de Certificados */}
        <CertificateTemplatePreview
          key={`cert-preview-${instructorSignatureName || 'no-name'}-${instructorSignatureUrl || 'no-url'}`}
          isOpen={showTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
          selectedTemplate={selectedCertificateTemplate}
          onSelectTemplate={(templateId) => {
            setSelectedCertificateTemplate(templateId)
          }}
          instructorSignatureUrl={instructorSignatureUrl}
          instructorSignatureName={instructorSignatureName}
          instructorDisplayName={workshopPreview?.instructor_name || undefined}
          studentName={workshopPreview?.title ? 'Estudiante Ejemplo' : undefined}
          courseName={workshopPreview?.title || undefined}
          issueDate={new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        />

        {/* Modal de Detalles del Estudiante */}
        <AnimatePresence>
          {showStudentDetailsModal && selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowStudentDetailsModal(false)
                setStudentDetailsData(null)
                setSelectedStudent(null)
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header del Modal */}
                <div className="bg-gradient-to-r from-[#0A2540] to-[#00D4B3] p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedStudent.profile_picture ? (
                        <img
                          src={selectedStudent.profile_picture}
                          alt={selectedStudent.display_name}
                          className="w-16 h-16 rounded-full border-4 border-white/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
                          {selectedStudent.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedStudent.display_name}</h2>
                        <p className="text-white/80 text-sm">{selectedStudent.email || selectedStudent.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowStudentDetailsModal(false)
                        setStudentDetailsData(null)
                        setSelectedStudent(null)
                      }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Settings className="w-5 h-5 rotate-0 hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                </div>

                {/* Contenido del Modal */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* KPIs Principales del Estudiante */}
                  {loadingStudentDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full"
                      />
                    </div>
                  ) : studentDetailsData ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      {[
                        {
                          icon: Target,
                          label: 'Progreso Total',
                          value: `${Math.round(studentDetailsData.enrollment?.progressPercentage || selectedStudent.progress_percentage || 0)}%`,
                          color: 'from-[#0A2540] to-[#00D4B3]'
                        },
                        {
                          icon: Clock,
                          label: 'Tiempo de Estudio',
                          value: `${studentDetailsData.studySessions?.totalCourseStudyTime || studentDetailsData.studySessions?.totalStudyTime || 0} hrs`,
                          color: 'from-[#00D4B3] to-[#10B981]'
                        },
                        {
                          icon: CheckCircle2,
                          label: 'Actividades Completadas',
                          value: `${studentDetailsData.engagement?.activitiesCompleted || 0}`,
                          color: 'from-[#10B981] to-[#00D4B3]'
                        },
                        {
                          icon: TrendingUp,
                          label: 'Racha de Días',
                          value: `${studentDetailsData.studySessions?.studyStreak || 0} días`,
                          color: 'from-[#F59E0B] to-[#10B981]'
                        }
                      ].map((kpi, index) => {
                        const IconComponent = kpi.icon
                        return (
                          <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30"
                          >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-2xl font-bold text-[#0A2540] dark:text-white mb-1">
                              {kpi.value}
                            </div>
                            <div className="text-xs font-medium text-[#6C757D] dark:text-white/60 uppercase tracking-wide">
                              {kpi.label}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : null}

                  {/* Gráficas y Estadísticas Detalladas */}
                  {studentDetailsData && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Gráfica de Progreso Semanal */}
                        <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-6 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Progreso Semanal</h3>
                              <p className="text-xs text-[#6C757D] dark:text-white/60">Últimos 7 días</p>
                            </div>
                          </div>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={studentDetailsData.studySessions?.weeklyProgress || [
                                { dia: 'Lun', progreso: 0 },
                                { dia: 'Mar', progreso: 0 },
                                { dia: 'Mié', progreso: 0 },
                                { dia: 'Jue', progreso: 0 },
                                { dia: 'Vie', progreso: 0 },
                                { dia: 'Sáb', progreso: 0 },
                                { dia: 'Dom', progreso: 0 }
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                                <XAxis dataKey="dia" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#1E2329',
                                    border: '1px solid #6C757D',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                />
                                <Bar dataKey="progreso" fill="#00D4B3" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Gráfica de Tiempo de Estudio */}
                        <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-6 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10B981] to-[#00D4B3] flex items-center justify-center">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Tiempo de Estudio</h3>
                              <p className="text-xs text-[#6C757D] dark:text-white/60">Distribución por día</p>
                            </div>
                          </div>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={studentDetailsData.studySessions?.dailyStudyTime || [
                                { dia: 'Lun', horas: 0 },
                                { dia: 'Mar', horas: 0 },
                                { dia: 'Mié', horas: 0 },
                                { dia: 'Jue', horas: 0 },
                                { dia: 'Vie', horas: 0 },
                                { dia: 'Sáb', horas: 0 },
                                { dia: 'Dom', horas: 0 }
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                                <XAxis dataKey="dia" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#1E2329',
                                    border: '1px solid #6C757D',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="horas"
                                  stroke="#10B981"
                                  strokeWidth={3}
                                  dot={{ fill: '#10B981', r: 4 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Métricas de Engagement */}
                      <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-6 border border-[#E9ECEF] dark:border-[#6C757D]/30 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#10B981] flex items-center justify-center">
                            <Users2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Métricas de Engagement</h3>
                            <p className="text-xs text-[#6C757D] dark:text-white/60">Nivel de participación del estudiante</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Sesiones Totales', value: `${studentDetailsData.studySessions?.totalSessions || 0}`, icon: LayoutDashboard },
                            { label: 'Promedio Diario', value: `${studentDetailsData.engagement?.avgDailyTime || 0} hrs`, icon: Clock },
                            { label: 'Lecciones Vistas', value: `${studentDetailsData.engagement?.lessonsViewed || 0}`, icon: Book },
                            { label: 'Notas Creadas', value: `${studentDetailsData.engagement?.notesCreated || 0}`, icon: FileText }
                          ].map((metric, index) => {
                            const IconComponent = metric.icon
                            return (
                              <div key={metric.label} className="text-center">
                                <div className="flex items-center justify-center mb-2">
                                  <IconComponent className="w-5 h-5 text-[#00D4B3]" />
                                </div>
                                <div className="text-xl font-bold text-[#0A2540] dark:text-white mb-1">
                                  {metric.value}
                                </div>
                                <div className="text-xs text-[#6C757D] dark:text-white/60">
                                  {metric.label}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Estadísticas de Interacción con SofLIA */}
                      <div className="bg-gradient-to-br from-[#0A2540]/5 to-[#00D4B3]/5 dark:from-[#0A2540]/10 dark:to-[#00D4B3]/10 rounded-xl p-6 border-2 border-[#00D4B3]/30 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center shadow-lg">
                            <Lightbulb className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-[#0A2540] dark:text-white">Interacción con SofLIA</h3>
                            <p className="text-xs text-[#6C757D] dark:text-white/60">Análisis de conversaciones y asistencia personalizada</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {[
                            {
                              icon: Rocket,
                              label: 'Conversaciones Totales',
                              value: `${studentDetailsData.lia?.totalConversations || 0}`,
                              sublabel: `${studentDetailsData.lia?.conversationsThisWeek || 0} esta semana`,
                              color: 'from-[#0A2540] to-[#00D4B3]'
                            },
                            {
                              icon: Sprout,
                              label: 'Mensajes Intercambiados',
                              value: `${studentDetailsData.lia?.totalMessages || 0}`,
                              sublabel: `Promedio: ${studentDetailsData.lia?.avgMessagesPerConversation || 0} por conversación`,
                              color: 'from-[#00D4B3] to-[#10B981]'
                            },
                            {
                              icon: Star,
                              label: 'Feedback Positivo',
                              value: `${studentDetailsData.lia?.positiveFeedbackRate || 0}%`,
                              sublabel: `${studentDetailsData.lia?.positiveFeedbackCount || 0} de ${studentDetailsData.lia?.totalConversations || 0} conversaciones`,
                              color: 'from-[#10B981] to-[#00D4B3]'
                            }
                          ].map((metric, index) => {
                            const IconComponent = metric.icon
                            return (
                              <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className="bg-white dark:bg-[#1E2329] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                                    <IconComponent className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-2xl font-bold text-[#0A2540] dark:text-white">
                                      {metric.value}
                                    </div>
                                    <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide">
                                      {metric.label}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-[#6C757D] dark:text-white/60 mt-2">
                                  {metric.sublabel}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>

                        {/* Gráfica de Conversaciones con SofLIA */}
                        <div className="bg-white dark:bg-[#1E2329] rounded-xl p-5 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-2 mb-4">
                            <Rocket className="w-5 h-5 text-[#00D4B3]" />
                            <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Frecuencia de Conversaciones</h4>
                          </div>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={studentDetailsData.lia?.conversationsByWeek?.map((week: any, index: number) => ({
                                semana: week.week || `S${index + 1}`,
                                conversaciones: week.count || 0
                              })) || [
                                  { semana: 'S1', conversaciones: 0 },
                                  { semana: 'S2', conversaciones: 0 },
                                  { semana: 'S3', conversaciones: 0 },
                                  { semana: 'S4', conversaciones: 0 },
                                  { semana: 'S5', conversaciones: 0 }
                                ]}>
                                <defs>
                                  <linearGradient id="colorConversaciones" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00D4B3" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#00D4B3" stopOpacity={0.1} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                                <XAxis dataKey="semana" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#1E2329',
                                    border: '1px solid #6C757D',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="conversaciones"
                                  stroke="#00D4B3"
                                  fillOpacity={1}
                                  fill="url(#colorConversaciones)"
                                  strokeWidth={2}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Análisis de Temas de Conversación */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                          {(studentDetailsData.lia?.conversationTopics || [
                            { tema: 'Dudas de Lecciones', count: 0, color: '#0A2540' },
                            { tema: 'Ayuda con Actividades', count: 0, color: '#00D4B3' },
                            { tema: 'Explicaciones Extra', count: 0, color: '#10B981' },
                            { tema: 'Motivación', count: 0, color: '#F59E0B' }
                          ]).map((tema: any, index: number) => (
                            <div key={tema.tema} className="bg-white dark:bg-[#1E2329] rounded-lg p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30 text-center">
                              <div
                                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: tema.color }}
                              >
                                {tema.count}
                              </div>
                              <div className="text-xs font-medium text-[#6C757D] dark:text-white/60">
                                {tema.tema}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Estadísticas de Sesiones de Estudio */}
                      <div className="bg-gradient-to-br from-[#10B981]/5 to-[#F59E0B]/5 dark:from-[#10B981]/10 dark:to-[#F59E0B]/10 rounded-xl p-6 border-2 border-[#10B981]/30 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#F59E0B] flex items-center justify-center shadow-lg">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-[#0A2540] dark:text-white">Hábitos de Estudio</h3>
                            <p className="text-xs text-[#6C757D] dark:text-white/60">Análisis de patrones y comportamiento de aprendizaje</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          {[
                            {
                              icon: Clock,
                              label: 'Sesiones Totales',
                              value: `${studentDetailsData.studySessions?.totalSessions || 0}`,
                              sublabel: studentDetailsData.studySessions?.lastSession?.hoursAgo
                                ? `Última: Hace ${studentDetailsData.studySessions.lastSession.hoursAgo} horas`
                                : 'Sin sesiones',
                              color: 'from-[#10B981] to-[#00D4B3]'
                            },
                            {
                              icon: TrendingUp,
                              label: 'Duración Promedio',
                              value: `${studentDetailsData.studySessions?.avgSessionDuration || 0} min`,
                              sublabel: 'Por sesión',
                              color: 'from-[#00D4B3] to-[#10B981]'
                            },
                            {
                              icon: Target,
                              label: 'Tiempo Total',
                              value: `${studentDetailsData.studySessions?.totalCourseStudyTime || studentDetailsData.studySessions?.totalStudyTime || 0} hrs`,
                              sublabel: 'En este curso',
                              color: 'from-[#F59E0B] to-[#10B981]'
                            },
                            {
                              icon: BarChart3,
                              label: 'Frecuencia Semanal',
                              value: `${studentDetailsData.studySessions?.weeklyFrequency || 0} días`,
                              sublabel: 'Promedio por semana',
                              color: 'from-[#0A2540] to-[#00D4B3]'
                            }
                          ].map((metric, index) => {
                            const IconComponent = metric.icon
                            return (
                              <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="bg-white dark:bg-[#1E2329] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30"
                              >
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-3`}>
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-2xl font-bold text-[#0A2540] dark:text-white mb-1">
                                  {metric.value}
                                </div>
                                <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide mb-2">
                                  {metric.label}
                                </div>
                                <div className="text-xs text-[#6C757D] dark:text-white/60">
                                  {metric.sublabel}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>

                        {/* Patrones de Estudio */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Horarios Preferidos */}
                          <div className="bg-white dark:bg-[#1E2329] rounded-xl p-5 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                            <div className="flex items-center gap-2 mb-4">
                              <Clock className="w-5 h-5 text-[#10B981]" />
                              <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Horarios Preferidos</h4>
                            </div>
                            <div className="space-y-3">
                              {(studentDetailsData.studySessions?.preferredTimeSlots || [
                                { periodo: 'Mañana (6am-12pm)', porcentaje: 0, color: '#F59E0B' },
                                { periodo: 'Tarde (12pm-6pm)', porcentaje: 0, color: '#00D4B3' },
                                { periodo: 'Noche (6pm-12am)', porcentaje: 0, color: '#10B981' },
                                { periodo: 'Madrugada (12am-6am)', porcentaje: 0, color: '#6C757D' }
                              ]).map((horario: any) => (
                                <div key={horario.periodo}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-[#6C757D] dark:text-white/70">{horario.periodo}</span>
                                    <span className="text-xs font-bold text-[#0A2540] dark:text-white">{horario.porcentaje}%</span>
                                  </div>
                                  <div className="w-full bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${horario.porcentaje}%`, backgroundColor: horario.color }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Días Más Activos */}
                          <div className="bg-white dark:bg-[#1E2329] rounded-xl p-5 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                            <div className="flex items-center gap-2 mb-4">
                              <BarChart3 className="w-5 h-5 text-[#00D4B3]" />
                              <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Días Más Activos</h4>
                            </div>
                            <div className="h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={studentDetailsData.studySessions?.activeDays || [
                                  { dia: 'L', sesiones: 0 },
                                  { dia: 'M', sesiones: 0 },
                                  { dia: 'X', sesiones: 0 },
                                  { dia: 'J', sesiones: 0 },
                                  { dia: 'V', sesiones: 0 },
                                  { dia: 'S', sesiones: 0 },
                                  { dia: 'D', sesiones: 0 }
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                                  <XAxis dataKey="dia" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 10 }} />
                                  <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 10 }} />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#1E2329',
                                      border: '1px solid #6C757D',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      fontSize: '12px'
                                    }}
                                  />
                                  <Bar dataKey="sesiones" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Insights de SofLIA */}
                      {studentDetailsData.studySessions && (
                        <div className="mt-4 bg-white dark:bg-[#1E2329] rounded-xl p-4 border-l-4 border-[#00D4B3]">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-[#0A2540] dark:text-white mb-1">Insights de SofLIA</h5>
                              <p className="text-xs text-[#6C757D] dark:text-white/70 leading-relaxed">
                                {studentDetailsData.studySessions.preferredTimeSlots && studentDetailsData.studySessions.preferredTimeSlots.length > 0 ? (
                                  <>
                                    Este estudiante muestra un patrón de estudio{' '}
                                    {studentDetailsData.studySessions.preferredTimeSlots.find((s: any) => s.porcentaje === Math.max(...studentDetailsData.studySessions.preferredTimeSlots.map((s: any) => s.porcentaje)))?.periodo.toLowerCase() || 'consistente'}.
                                    {' '}Frecuencia semanal: {studentDetailsData.studySessions.weeklyFrequency} días.
                                    {' '}Duración promedio: {studentDetailsData.studySessions.avgSessionDuration} minutos por sesión.
                                    {studentDetailsData.studySessions.studyStreak > 0 && ` Racha actual: ${studentDetailsData.studySessions.studyStreak} días consecutivos.`}
                                  </>
                                ) : (
                                  'Aún no hay suficientes datos para generar insights personalizados.'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Información Adicional */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Flag className="w-4 h-4 text-[#00D4B3]" />
                            <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Estado de Inscripción</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Estado:</span>
                              <span className={`font-semibold ${selectedStudent.enrollment_status === 'completed' ? 'text-[#10B981]' :
                                selectedStudent.enrollment_status === 'active' ? 'text-[#00D4B3]' :
                                  'text-[#6C757D]'
                                }`}>
                                {selectedStudent.enrollment_status === 'completed' ? 'Completado' :
                                  selectedStudent.enrollment_status === 'active' ? 'Activo' :
                                    selectedStudent.enrollment_status === 'paused' ? 'Pausado' : 'Cancelado'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Inscrito:</span>
                              <span className="font-semibold text-[#0A2540] dark:text-white">
                                {selectedStudent.enrolled_at ? new Date(selectedStudent.enrolled_at).toLocaleDateString('es-ES') : 'â€”'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Última Actividad:</span>
                              <span className="font-semibold text-[#0A2540] dark:text-white">
                                {selectedStudent.last_accessed_at ? new Date(selectedStudent.last_accessed_at).toLocaleDateString('es-ES') : 'Nunca'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Award className="w-4 h-4 text-[#F59E0B]" />
                            <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Logros y Certificados</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Certificados:</span>
                              <span className="font-semibold text-[#0A2540] dark:text-white">0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Badges Obtenidos:</span>
                              <span className="font-semibold text-[#0A2540] dark:text-white">3</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Ranking:</span>
                              <span className="font-semibold text-[#00D4B3]">Top 15%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer del Modal */}
                <div className="border-t border-[#E9ECEF] dark:border-[#6C757D]/30 p-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12]/50">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowStudentDetailsModal(false)
                        setStudentDetailsData(null)
                        setSelectedStudent(null)
                      }}
                      className="px-4 py-2 bg-[#6C757D]/10 hover:bg-[#6C757D]/20 text-[#6C757D] dark:text-white/70 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Cerrar
                    </button>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#00D4B3] hover:from-[#0d2f4d] hover:to-[#00D4B3] text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all"
                    >
                      Enviar Mensaje
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modal para mover lección */}
        <AnimatePresence>
          {showMoveLessonModal && movingLesson && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMoveLessonModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-[#1E2329] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Mover Lección</h3>
                    <p className="text-xs text-[#6C757D] dark:text-white/60">Selecciona el módulo de destino</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {modules.map((module) => (
                    <motion.button
                      key={module.module_id}
                      onClick={() => handleMoveLessonToModule(module.module_id)}
                      disabled={module.module_id === movingLesson.module_id}
                      whileHover={module.module_id !== movingLesson.module_id ? { x: 4, backgroundColor: 'rgba(0,0,0,0.05)' } : {}}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                        module.module_id === movingLesson.module_id
                          ? 'bg-[#E9ECEF]/50 border-transparent opacity-50 cursor-not-allowed'
                          : 'border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Book className={`w-4 h-4 ${module.module_id === movingLesson.module_id ? 'text-[#6C757D]' : 'text-[#00D4B3]'}`} />
                        <span className="text-sm font-medium text-[#0A2540] dark:text-white truncate max-w-[200px]">
                          {module.module_title}
                        </span>
                      </div>
                      {module.module_id === movingLesson.module_id ? (
                        <span className="text-[10px] font-bold text-[#6C757D] uppercase tracking-wider">Actual</span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#6C757D]/30 group-hover:text-[#00D4B3] transition-colors" />
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex justify-end">
                  <button
                    onClick={() => setShowMoveLessonModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-[#6C757D] hover:text-[#0A2540] dark:text-white/60 dark:hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}