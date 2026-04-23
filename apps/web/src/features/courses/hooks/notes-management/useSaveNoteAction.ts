"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { LearnEditableNote, LearnLesson, LearnNoteFormData } from "../../components/learn/types";
import { saveNoteRequest } from "./note-mutations";
import type { NotesStatsOperation } from "./types";

type UseSaveNoteActionParams = {
  slug: string;
  currentLesson: LearnLesson | null;
  editingNote: LearnEditableNote | null;
  addNoteToLocalState: (noteData: unknown, lessonId: string) => void;
  closeNotesModal: () => void;
  loadCourseNotes: (courseSlug: string) => Promise<void>;
  loadNotesStats: (courseSlug: string) => Promise<void>;
  setNoteError: Dispatch<SetStateAction<string | null>>;
  updateNotesStatsOptimized: (operation: NotesStatsOperation, lessonId?: string) => Promise<void>;
};

export function useSaveNoteAction({
  slug,
  currentLesson,
  editingNote,
  addNoteToLocalState,
  closeNotesModal,
  loadCourseNotes,
  loadNotesStats,
  setNoteError,
  updateNotesStatsOptimized,
}: UseSaveNoteActionParams) {
  return useCallback(
    async (noteData: LearnNoteFormData) => {
      if (!slug) {
        setNoteError("No se pudo determinar el curso para guardar la nota");
        return false;
      }

      const noteId = editingNote?.id.trim() ? editingNote.id : undefined;
      const targetLessonId = editingNote?.lessonId || currentLesson?.lesson_id;
      const targetAction = noteId ? "actualizar" : "guardar";

      if (!targetLessonId) {
        setNoteError(
          noteId
            ? "No se pudo determinar la leccion de la nota a editar"
            : "Debe seleccionar una leccion para guardar la nota"
        );
        return false;
      }

      try {
        const result = await saveNoteRequest({
          slug,
          lessonId: targetLessonId,
          noteId,
          noteData,
        });

        if (!result.ok) {
          setNoteError(`Error al ${targetAction} la nota: ${result.error}`);
          return false;
        }

        addNoteToLocalState(result.data, targetLessonId);
        await updateNotesStatsOptimized(noteId ? "update" : "create", targetLessonId);
        closeNotesModal();
        return true;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error sincronizando guardado de nota:", error);
        }

        await loadCourseNotes(slug);
        await loadNotesStats(slug);
        return false;
      }
    },
    [
      addNoteToLocalState,
      closeNotesModal,
      currentLesson?.lesson_id,
      editingNote?.id,
      editingNote?.lessonId,
      loadCourseNotes,
      loadNotesStats,
      setNoteError,
      slug,
      updateNotesStatsOptimized,
    ]
  );
}
