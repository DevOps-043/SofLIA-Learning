"use client";

import { logger as techDebtLogger } from "@/lib/utils/logger";
import { useCallback } from "react";
import type {
  LearnEditableNote,
  LearnLesson,
  LearnNoteFormData,
} from "../../components/learn/types";
import { createNoteRequest, updateNoteRequest } from "./note-save.api";
import type { CourseNotesLoader, NoteStateMutation } from "./types";

interface UsePersistNoteMutationParams {
  addNoteToLocalState: NoteStateMutation;
  currentLesson: LearnLesson | null;
  editingNote: LearnEditableNote | null;
  loadCourseNotes: CourseNotesLoader;
  organizationId?: string | null;
  setNoteError: (message: string | null) => void;
  slug: string;
  updateNotesStatsOptimized: (
    operation: "create" | "update",
    lessonId?: string
  ) => Promise<void>;
}

export interface PersistNoteOptions {
  /**
   * Cuando es `true` (autoguardado), los fallos no muestran toast al usuario:
   * el autoguardado es de mejor esfuerzo y no debe interrumpir la escritura.
   */
  silent?: boolean;
}

/**
 * Persiste una nota (crear o actualizar) SIN cerrar el modal y devuelve el id
 * de la nota guardada (o `null` si no se pudo guardar). Es la base del
 * autoguardado: el primer guardado crea la nota y, con el id devuelto, los
 * guardados siguientes la actualizan en lugar de duplicarla.
 */
export function usePersistNoteMutation({
  addNoteToLocalState,
  currentLesson,
  editingNote,
  loadCourseNotes,
  organizationId,
  setNoteError,
  slug,
  updateNotesStatsOptimized,
}: UsePersistNoteMutationParams) {
  return useCallback(
    async (
      noteData: LearnNoteFormData,
      noteId: string,
      options: PersistNoteOptions = {}
    ): Promise<string | null> => {
      const { silent = false } = options;
      const reportError = (message: string) => {
        if (!silent) {
          setNoteError(message);
        }
      };

      if (!slug) {
        reportError("No se pudo determinar el curso para guardar la nota");
        return null;
      }

      const targetLessonId = editingNote?.lessonId || currentLesson?.lesson_id;
      if (!targetLessonId) {
        reportError("Debe seleccionar una leccion para guardar la nota");
        return null;
      }

      try {
        if (noteId.trim()) {
          const result = await updateNoteRequest(slug, targetLessonId, noteId, noteData);
          if (!result.ok) {
            reportError(`Error al actualizar la nota: ${result.error}`);
            return null;
          }

          addNoteToLocalState(result.data, targetLessonId);
          await updateNotesStatsOptimized("update", targetLessonId);
          return noteId;
        }

        const result = await createNoteRequest(slug, targetLessonId, noteData, organizationId);
        if (!result.ok) {
          reportError(`Error al guardar la nota: ${result.error}`);
          return null;
        }

        addNoteToLocalState(result.data, targetLessonId);
        await updateNotesStatsOptimized("create", targetLessonId);
        return extractNoteId(result.data);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          techDebtLogger.error("Error persistiendo nota:", error);
        }
        if (!silent) {
          await loadCourseNotes(slug);
        }
        return null;
      }
    },
    [
      addNoteToLocalState,
      currentLesson?.lesson_id,
      editingNote?.lessonId,
      loadCourseNotes,
      organizationId,
      setNoteError,
      slug,
      updateNotesStatsOptimized,
    ]
  );
}

function extractNoteId(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const candidate = record.note_id ?? record.id;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}
