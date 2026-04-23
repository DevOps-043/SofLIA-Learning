import {
  CannotCompleteModal,
  CourseCompletedModal,
  DeleteNoteConfirmModal,
  LearnPageValidationModal,
} from '@/features/courses/components/learn';
import { CourseRatingModal } from '@/features/courses/components/CourseRatingModal';
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';
import { NotesModalComponent } from './CourseLearnLazyComponents';

interface CourseLearnModalsProps {
  courseTitle: string;
  handleValidationClose: () => void;
  logic: LearnPageLogicResult;
}

export function CourseLearnModals({
  courseTitle,
  handleValidationClose,
  logic,
}: CourseLearnModalsProps) {
  return (
    <>
      <DeleteNoteConfirmModal
        isDeleting={logic.isDeletingNote}
        isOpen={logic.isDeleteNoteConfirmOpen}
        onClose={logic.closeDeleteNoteConfirm}
        onConfirm={logic.confirmDeleteNote}
      />
      <NotesModalComponent
        initialNote={logic.editingNote}
        isEditing={!!logic.editingNote}
        isOpen={logic.isNotesModalOpen}
        onClose={logic.closeNotesModal}
        onDelete={logic.handleDeleteNote}
        onSave={logic.handleSaveNote}
      />
      <CourseCompletedModal
        isOpen={logic.isCourseCompletedModalOpen}
        onClose={() => {
          void logic.handleCourseCompletedClose();
        }}
      />
      <CannotCompleteModal
        isOpen={logic.isCannotCompleteModalOpen}
        onClose={logic.closeCannotCompleteModal}
      />
      <LearnPageValidationModal
        details={logic.validationModal.details}
        isOpen={logic.validationModal.isOpen}
        message={logic.validationModal.message}
        onClose={handleValidationClose}
        title={logic.validationModal.title}
        type={logic.validationModal.type}
      />
      <CourseRatingModal
        courseTitle={courseTitle}
        isOpen={logic.isRatingModalOpen}
        onClose={logic.closeRatingModal}
        onSubmit={logic.handleRatingSubmit}
      />
    </>
  );
}
