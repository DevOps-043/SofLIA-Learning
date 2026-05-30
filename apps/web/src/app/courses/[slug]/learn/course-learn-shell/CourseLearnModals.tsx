'use client'

import { CannotCompleteModal, CourseCompletedModal, DeleteNoteConfirmModal, LearnPageValidationModal } from '@/features/courses/components/learn'
import { ModuleLearningSummaryViewerModal } from '@/features/courses/components/learn/notes/ModuleLearningSummaryViewerModal'
import { CourseRatingModal } from '@/features/courses/components/CourseRatingModal'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { NotesModalComponent } from './dynamic-components'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLearnModals({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  return (
    <>
      <DeleteNoteConfirmModal isOpen={logic.isDeleteNoteConfirmOpen} isDeleting={logic.isDeletingNote} onClose={logic.closeDeleteNoteConfirm} onConfirm={logic.confirmDeleteNote} />
      <NotesModalComponent isOpen={logic.isNotesModalOpen} onClose={logic.closeNotesModal} onSave={logic.handleSaveNote} onPersist={logic.persistNote} onDelete={logic.handleDeleteNote} initialNote={logic.editingNote} isEditing={!!logic.editingNote} />
      <ModuleLearningSummaryViewerModal
        isOpen={Boolean(logic.viewingGeneratedSummary)}
        isRegenerating={logic.regeneratingSummaryModuleId === logic.viewingGeneratedSummary?.moduleId}
        onClose={logic.closeGeneratedSummaryViewer}
        onDuplicate={logic.viewingGeneratedSummary ? () => logic.duplicateGeneratedSummary(logic.viewingGeneratedSummary!) : undefined}
        onNavigateNext={
          logic.viewingSummaryIndex >= 0 && logic.viewingSummaryIndex < logic.viewingSummaryVersions.length - 1
            ? () => logic.navigateGeneratedSummary('next')
            : undefined
        }
        onNavigatePrevious={
          logic.viewingSummaryIndex > 0
            ? () => logic.navigateGeneratedSummary('previous')
            : undefined
        }
        onRegenerate={logic.viewingGeneratedSummary ? () => logic.regenerateSummary(logic.viewingGeneratedSummary!.moduleId) : undefined}
        summary={logic.viewingGeneratedSummary}
        summaryPosition={
          logic.viewingSummaryIndex >= 0
            ? { current: logic.viewingSummaryIndex + 1, total: logic.viewingSummaryVersions.length }
            : undefined
        }
      />
      <CourseCompletedModal isOpen={logic.isCourseCompletedModalOpen} onClose={() => { void logic.handleCourseCompletedClose() }} />
      <CannotCompleteModal isOpen={logic.isCannotCompleteModalOpen} onClose={logic.closeCannotCompleteModal} />
      <LearnPageValidationModal isOpen={logic.validationModal.isOpen} type={logic.validationModal.type} title={logic.validationModal.title} message={logic.validationModal.message} details={logic.validationModal.details} onClose={shell.handleValidationClose} />
      <CourseRatingModal isOpen={logic.isRatingModalOpen} onClose={logic.closeRatingModal} courseTitle={logic.course?.title || logic.course?.course_title || ''} onSubmit={logic.handleRatingSubmit} />
    </>
  )
}
