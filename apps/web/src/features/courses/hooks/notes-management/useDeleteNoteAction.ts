"use client";

import { useCallback } from "react";

import { isAbortError, readResponseError } from "./api";
import { restoreNotesState } from "./delete-note.helpers";
import { deleteNoteRequest } from "./note-mutations";
import type { UseDeleteNoteActionParams } from "./delete-note.types";

export function useDeleteNoteAction({
  slug,
  currentLesson,
  editingNote,
  noteToDelete,
  savedNotes,
  closeDeleteNoteConfirm,
  closeNotesModal,
  loadCourseNotes,
  loadNotesStats,
  removeNoteFromLocalState,
  setIsDeleteNoteConfirmOpen,
  setIsDeletingNote,
  setNoteError,
  setNoteToDelete,
  updateNotesStatsOptimized,
}: UseDeleteNoteActionParams) {
  const handleDeleteNote = useCallback(
    (noteId: string) => {
      setNoteToDelete(savedNotes.find((savedNote) => savedNote.id === noteId) || null);
      setIsDeleteNoteConfirmOpen(true);
    },
    [savedNotes, setIsDeleteNoteConfirmOpen, setNoteToDelete]
  );

  const confirmDeleteNote = useCallback(async () => {
    if (!noteToDelete || !slug) {
      closeDeleteNoteConfirm();
      return;
    }

    const targetLessonId = noteToDelete.lessonId || currentLesson?.lesson_id;
    if (!targetLessonId) {
      closeDeleteNoteConfirm();
      setNoteError("No se pudo determinar la leccion de la nota a eliminar");
      return;
    }

    const isDeletingEditingNote = editingNote?.id === noteToDelete.id;
    setIsDeletingNote(true);

    try {
      if (isDeletingEditingNote) closeNotesModal();

      removeNoteFromLocalState(noteToDelete.id);
      await updateNotesStatsOptimized("delete", targetLessonId);

      const response = await deleteNoteRequest(slug, targetLessonId, noteToDelete.id);
      if (!response.ok) {
        await restoreNotesState(slug, loadCourseNotes, loadNotesStats);
        const errorMessage = await readResponseError(response, "Error desconocido");
        setNoteError(`Error al eliminar la nota: ${errorMessage}`);
      }

      closeDeleteNoteConfirm();
    } catch (error) {
      await restoreNotesState(slug, loadCourseNotes, loadNotesStats);
      closeDeleteNoteConfirm();
      const errorMessage = isAbortError(error)
        ? "La eliminacion de la nota tardó demasiado. Intenta de nuevo."
        : "Error al eliminar la nota. Por favor, intenta de nuevo.";

      console.error('[useDeleteNoteAction] confirmDeleteNote failed', error);
      setNoteError(errorMessage);
    } finally {
      setIsDeletingNote(false);
    }
  }, [
    closeDeleteNoteConfirm,
    closeNotesModal,
    currentLesson?.lesson_id,
    editingNote?.id,
    loadCourseNotes,
    loadNotesStats,
    noteToDelete,
    removeNoteFromLocalState,
    setIsDeletingNote,
    setNoteError,
    slug,
    updateNotesStatsOptimized,
  ]);

  return { confirmDeleteNote, handleDeleteNote };
}
