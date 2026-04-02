'use client'

import { ActivityModal } from '../ActivityModal'
import { CertificateTemplatePreview } from '../CertificateTemplatePreview'
import { LessonModal } from '../LessonModal'
import { MaterialModal } from '../MaterialModal'
import { ModuleModal } from '../ModuleModal'
import { useCourseManagementContext } from './CourseManagementContext'
import { CourseManagementMoveLessonModal } from './CourseManagementMoveLessonModal'
import { CourseManagementStudentDetailsModal } from './CourseManagementStudentDetailsModal'

export function CourseManagementDialogs() {
  const { courseId, state } = useCourseManagementContext()
  const {
    createActivity,
    createMaterial,
    editingActivity,
    editingLessonId,
    editingMaterial,
    editingModuleId,
    fetchActivities,
    fetchLessons,
    fetchMaterials,
    handleCreateLesson,
    handleCreateModule,
    handleEditModule,
    instructors,
    instructorSignatureName,
    instructorSignatureUrl,
    selectedCertificateTemplate,
    selectedLesson,
    selectedModule,
    setEditingActivity,
    setEditingLessonId,
    setEditingMaterial,
    setEditingModuleId,
    setSelectedCertificateTemplate,
    setSelectedLesson,
    setSelectedModule,
    setShowActivityModal,
    setShowLessonModal,
    setShowMaterialModal,
    setShowModuleModal,
    setShowTemplatePreview,
    showActivityModal,
    showLessonModal,
    showMaterialModal,
    showModuleModal,
    showTemplatePreview,
    updateActivity,
    updateLesson,
    updateMaterial,
    workshopPreview,
  } = state

  return (
    <>
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
                await updateLesson(selectedLesson.lesson_id, data, courseId)
                await fetchLessons(editingModuleId, courseId)
              } else {
                await handleCreateLesson(data)
              }

              setShowLessonModal(false)
              setSelectedLesson(null)
              setEditingModuleId(null)
            } catch (error) {
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
              await updateMaterial(editingMaterial.material_id, data)
              await fetchMaterials(editingLessonId)
            } else {
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
              await updateActivity(editingActivity.activity_id, data)
              await fetchActivities(editingLessonId)
            } else {
              await createActivity(editingLessonId, data)
              await fetchActivities(editingLessonId)
            }

            setShowActivityModal(false)
            setEditingLessonId(null)
            setEditingActivity(null)
          }}
        />
      )}

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
        issueDate={new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      />

      <CourseManagementStudentDetailsModal />
      <CourseManagementMoveLessonModal />
    </>
  )
}
