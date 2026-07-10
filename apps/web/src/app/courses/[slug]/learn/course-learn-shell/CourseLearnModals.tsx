'use client'

import { CannotCompleteModal, CourseCompletedModal, DeleteNoteConfirmModal, LearnPageValidationModal } from '@/features/courses/components/learn'
import { CourseRatingModal } from '@/features/courses/components/CourseRatingModal'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { NotesModalComponent } from './dynamic-components'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLearnModals({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  return (
    <>
      <DeleteNoteConfirmModal isOpen={logic.isDeleteNoteConfirmOpen} isDeleting={logic.isDeletingNote} onClose={logic.closeDeleteNoteConfirm} onConfirm={logic.confirmDeleteNote} />
      <NotesModalComponent isOpen={logic.isNotesModalOpen} onClose={logic.closeNotesModal} onSave={logic.handleSaveNote} onPersist={logic.persistNote} onDelete={logic.handleDeleteNote} initialNote={logic.editingNote} isEditing={!!logic.editingNote} />
      <CourseCompletedModal
        isOpen={logic.isCourseCompletedModalOpen}
        onClose={() => { void logic.handleCourseCompletedClose() }}
        orgSlug={logic.orgSlug}
        courseId={logic.course?.id ?? logic.course?.course_id ?? null}
      />
      <CannotCompleteModal isOpen={logic.isCannotCompleteModalOpen} onClose={logic.closeCannotCompleteModal} />
      <LearnPageValidationModal isOpen={logic.validationModal.isOpen} type={logic.validationModal.type} title={logic.validationModal.title} message={logic.validationModal.message} details={logic.validationModal.details} onClose={shell.handleValidationClose} />
      <CourseRatingModal isOpen={logic.isRatingModalOpen} onClose={logic.closeRatingModal} courseTitle={logic.course?.title || logic.course?.course_title || ''} onSubmit={logic.handleRatingSubmit} />
    </>
  )
}
