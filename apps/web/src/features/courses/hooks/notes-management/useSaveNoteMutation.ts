"use client";

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback } from "react";
import type {
  LearnEditableNote,
  LearnLesson,
  LearnNoteFormData,
} from "../../components/learn/types";
import { createNoteRequest, updateNoteRequest } from "./note-save.api";
import type { CourseNotesLoader, NoteStateMutation } from "./types";

interface UseSaveNoteMutationParams {
  addNoteToLocalState: NoteStateMutation;
  closeNotesModal: () => void;
  currentLesson: LearnLesson | null;
  editingNote: LearnEditableNote | null;
  loadCourseNotes: CourseNotesLoader;
  loadNotesStats: CourseNotesLoader;
  organizationId?: string | null;
  setNoteError: (message: string | null) => void;
  slug: string;
  updateNotesStatsOptimized: (operation: "create" | "update", lessonId?: string) => Promise<void>;
}

export function useSaveNoteMutation({
  addNoteToLocalState,
  closeNotesModal,
  currentLesson,
  editingNote,
  loadCourseNotes,
  loadNotesStats,
  organizationId,
  setNoteError,
  slug,
  updateNotesStatsOptimized,
}: UseSaveNoteMutationParams) {
  return useCallback(async (noteData: LearnNoteFormData) => {
    if (!slug) {
      setNoteError("No se pudo determinar el curso para guardar la nota");
      return false;
    }

    const targetLessonId = editingNote?.lessonId || currentLesson?.lesson_id;

    try {
      if (editingNote?.id.trim()) {
        if (!targetLessonId) {
          setNoteError("No se pudo determinar la leccion de la nota a editar");
          return false;
        }

        const result = await updateNoteRequest(slug, targetLessonId, editingNote.id, noteData, organizationId);
        if (!result.ok) {
          setNoteError(`Error al actualizar la nota: ${result.error}`);
          return false;
        }

        addNoteToLocalState(result.data, targetLessonId);
        await updateNotesStatsOptimized("update", targetLessonId);
        closeNotesModal();
        return true;
      }

      if (!targetLessonId) {
        setNoteError(
          "Selecciona una lección antes de tomar notas: aún no se está guardando."
        );
        return false;
      }

      const result = await createNoteRequest(slug, targetLessonId, noteData, organizationId);
      if (!result.ok) {
        setNoteError(`Error al guardar la nota: ${result.error}`);
        return false;
      }

      addNoteToLocalState(result.data, targetLessonId);
      await updateNotesStatsOptimized("create", targetLessonId);
      closeNotesModal();
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        techDebtLogger.error("Error sincronizando guardado de nota:", error);
      }
      await loadCourseNotes(slug);
      await loadNotesStats(slug);
      return false;
    }
  }, [
    addNoteToLocalState,
    closeNotesModal,
    currentLesson?.lesson_id,
    editingNote?.id,
    editingNote?.lessonId,
    loadCourseNotes,
    loadNotesStats,
    organizationId,
    setNoteError,
    slug,
    updateNotesStatsOptimized,
  ]);
}
