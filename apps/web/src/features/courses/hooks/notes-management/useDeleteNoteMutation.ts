"use client";

import { useCallback, useState } from "react";
import type { LearnEditableNote, LearnLesson, LearnSavedNote } from "../../components/learn/types";
import { fetchWithTimeout, isAbortError, readResponseError } from "./api";
import type { CourseNotesLoader, NoteRemoval } from "./types";

interface UseDeleteNoteMutationParams {
  closeNotesModal: () => void;
  currentLesson: LearnLesson | null;
  editingNote: LearnEditableNote | null;
  loadCourseNotes: CourseNotesLoader;
  loadNotesStats: CourseNotesLoader;
  removeNoteFromLocalState: NoteRemoval;
  savedNotes: LearnSavedNote[];
  setNoteError: (message: string | null) => void;
  slug: string;
  updateNotesStatsOptimized: (operation: "delete", lessonId?: string) => Promise<void>;
}

export function useDeleteNoteMutation({
  closeNotesModal,
  currentLesson,
  editingNote,
  loadCourseNotes,
  loadNotesStats,
  removeNoteFromLocalState,
  savedNotes,
  setNoteError,
  slug,
  updateNotesStatsOptimized,
}: UseDeleteNoteMutationParams) {
  const [isDeleteNoteConfirmOpen, setIsDeleteNoteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<LearnSavedNote | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  const closeDeleteNoteConfirm = useCallback(() => {
    setIsDeleteNoteConfirmOpen(false);
    setNoteToDelete(null);
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNoteToDelete(savedNotes.find(savedNote => savedNote.id === noteId) || null);
    setIsDeleteNoteConfirmOpen(true);
  }, [savedNotes]);

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

      const response = await fetchWithTimeout(`/api/courses/${slug}/lessons/${targetLessonId}/notes/${noteToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        await loadCourseNotes(slug);
        await loadNotesStats(slug);
        setNoteError(`Error al eliminar la nota: ${await readResponseError(response, "Error desconocido")}`);
      }

      closeDeleteNoteConfirm();
    } catch (error) {
      await loadCourseNotes(slug);
      await loadNotesStats(slug);
      closeDeleteNoteConfirm();
      setNoteError(isAbortError(error)
        ? "La eliminacion de la nota tardo demasiado. Intenta de nuevo."
        : "Error al eliminar la nota. Por favor, intenta de nuevo.");
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
    setNoteError,
    slug,
    updateNotesStatsOptimized,
  ]);

  return { closeDeleteNoteConfirm, confirmDeleteNote, handleDeleteNote, isDeleteNoteConfirmOpen, isDeletingNote };
}
