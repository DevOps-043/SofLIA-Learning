'use client'

import { ArrowLeft, Book, Settings, Eye, BarChart3, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ModuleModal } from '@/features/admin/components/ModuleModal'
import { LessonModal } from '@/features/admin/components/LessonModal'
import { MaterialModal } from '@/features/admin/components/MaterialModal'
import { ActivityModal } from '@/features/admin/components/ActivityModal'
import { CertificateTemplatePreview } from '@/features/admin/components/CertificateTemplatePreview'
import { useInstructorCourseManagementLogic } from '@/features/instructor/hooks/useInstructorCourseManagementLogic'
import type { AdminLesson } from '@/features/admin/services/adminLessons.service'
import {
  InstructorModulesTab,
  InstructorConfigTab,
  InstructorPreviewTab,
  InstructorStatsTab,
  DeleteModuleModal,
  DeleteLessonModal,
} from './InstructorCourseManagement'

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
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl border backdrop-blur-md transition-all duration-300 ${
              feedbackMessage.type === 'success'
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
                onClick={() => setActiveTab(tab.key as 'modules' | 'config' | 'preview' | 'stats')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.key
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

        {activeTab === 'modules' && (
          <InstructorModulesTab
            modules={modules}
            modulesLoading={modulesLoading}
            expandedModules={expandedModules}
            expandedLessons={expandedLessons}
            toggleModule={toggleModule}
            toggleLesson={toggleLesson}
            lessons={lessons}
            materials={materials}
            activities={activities}
            setSelectedModule={setSelectedModule}
            setShowModuleModal={setShowModuleModal}
            setDeletingModule={setDeletingModule}
            setShowDeleteModuleModal={setShowDeleteModuleModal}
            setSelectedLesson={setSelectedLesson}
            setShowLessonModal={setShowLessonModal}
            setEditingModuleId={setEditingModuleId}
            setEditingLessonId={setEditingLessonId}
            setEditingActivityId={setEditingActivityId}
            setDeletingLesson={setDeletingLesson}
            setShowDeleteLessonModal={setShowDeleteLessonModal}
            setShowMaterialModal={setShowMaterialModal}
            setShowActivityModal={setShowActivityModal}
          />
        )}

        {activeTab === 'config' && (
          <InstructorConfigTab
            courseId={courseId}
            configData={configData}
            setConfigData={setConfigData}
            handleConfigChange={handleConfigChange}
            handleSaveConfig={handleSaveConfig}
            savingConfig={savingConfig}
            courseSkills={courseSkills}
            setCourseSkills={setCourseSkills}
            savingSkills={savingSkills}
          />
        )}

        {activeTab === 'preview' && (
          <InstructorPreviewTab
            workshopPreview={workshopPreview}
            previewLoading={previewLoading}
          />
        )}

        {activeTab === 'stats' && (
          <InstructorStatsTab
            modules={modules}
            userStats={userStats}
            enrolledUsers={enrolledUsers}
            statsLoading={statsLoading}
            chartData={chartData}
          />
        )}

        {showModuleModal && (
          <ModuleModal
            module={selectedModule}
            onClose={() => {
              setShowModuleModal(false)
              setSelectedModule(null)
            }}
            onSave={async (data: Record<string, unknown>) => {
              if (selectedModule) await updateModule(courseId, selectedModule.module_id, data)
              else await createModule(courseId, data)
              setShowModuleModal(false)
            }}
          />
        )}

        {showDeleteModuleModal && deletingModule && (
          <DeleteModuleModal
            deletingModule={deletingModule}
            onCancel={() => {
              setShowDeleteModuleModal(false)
              setDeletingModule(null)
            }}
            onConfirm={async () => {
              try {
                await deleteModule(courseId, deletingModule.module_id)
                await fetchModules(courseId)
                setShowDeleteModuleModal(false)
                setDeletingModule(null)
              } catch {
                showFeedbackMessage('error', 'No se pudo eliminar el módulo')
              }
            }}
          />
        )}

        {showDeleteLessonModal && deletingLesson && (
          <DeleteLessonModal
            deletingLesson={deletingLesson}
            onCancel={() => {
              setShowDeleteLessonModal(false)
              setDeletingLesson(null)
            }}
            onConfirm={async () => {
              try {
                await deleteLesson(deletingLesson.lesson_id, courseId)
                if (deletingLesson.module_id) {
                  await fetchLessons(deletingLesson.module_id, courseId)
                }
                setShowDeleteLessonModal(false)
                setDeletingLesson(null)
              } catch {
                showFeedbackMessage('error', 'No se pudo eliminar la lección')
              }
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
            onSave={async (data: Record<string, unknown>) => {
              if (selectedLesson) {
                await updateLesson(selectedLesson.lesson_id, data, courseId)
                if (selectedLesson.module_id) {
                  await fetchLessons(selectedLesson.module_id, courseId)
                }
              } else {
                await createLesson(editingModuleId, data, courseId)
                await fetchLessons(editingModuleId, courseId)
              }
              setShowLessonModal(false)
              setSelectedLesson(null)
              setEditingModuleId(null)
            }}
            instructors={user ? [{ id: (user as { id: string }).id, name: (user as { display_name?: string; username?: string; email?: string }).display_name || (user as { username?: string }).username || (user as { email?: string }).email || '' }] : []}
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
              onSave={async (data: Record<string, unknown>) => {
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
          const editingActivity = editingActivityId
            ? activities.find((a: { activity_id: string }) => a.activity_id === editingActivityId) || null
            : null
          return (
            <ActivityModal
              activity={editingActivity}
              lessonId={editingLessonId}
              onClose={() => {
                setShowActivityModal(false)
                setEditingLessonId(null)
                setEditingActivityId(null)
              }}
              onSave={async (data: Record<string, unknown>) => {
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
          instructorDisplayName={
            workshopPreview?.instructor_name ||
            (user as { display_name?: string } | null)?.display_name ||
            ((user as { first_name?: string; last_name?: string } | null)?.first_name &&
             (user as { first_name?: string; last_name?: string } | null)?.last_name
              ? `${(user as { first_name: string }).first_name} ${(user as { last_name: string }).last_name}`
              : (user as { username?: string } | null)?.username) ||
            undefined
          }
          studentName={workshopPreview?.title ? 'Estudiante Ejemplo' : undefined}
          courseName={workshopPreview?.title || undefined}
          issueDate={new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        />
      </div>
    </div>
  )
}

export default InstructorCourseManagementPage
