"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  LearnEditableNote,
  LearnLesson,
  LearnModule,
  LearnNoteFormData,
  LearnNotesStats,
  LearnSavedNote,
} from "../components/learn/types";
import {
  buildLiaDraftNote,
  buildSavedNoteFromMutation,
  formatNoteTimestamp,
  getDefaultNotesStats,
  mapApiNoteToSavedNote,
  normalizeNoteFormData,
} from "../components/learn/notes/utils";

type UseNotesManagementParams = {
  slug: string;
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  isNotesCollapsed: boolean;
  closeLia: () => void;
};

const NOTE_DELETE_TIMEOUT_MS = 20000;

function getErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const error = "error" in data ? data.error : undefined;
  const message = "message" in data ? data.message : undefined;

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
}

async function readResponseError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = (await response.json()) as unknown;
    return getErrorMessage(data, fallback);
  } catch {
    return fallback;
  }
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const name = "name" in error ? error.name : undefined;
  return typeof name === "string" && name === "AbortError";
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: abortController.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function useNotesManagement({
  slug,
  modules,
  currentLesson,
  isNotesCollapsed,
  closeLia,
}: UseNotesManagementParams) {
  const [savedNotes, setSavedNotes] = useState<LearnSavedNote[]>([]);
  const [notesStats, setNotesStats] = useState<LearnNotesStats>({
    totalNotes: 0,
    lessonsWithNotes: "0/0",
    lastUpdate: "-",
  });
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isDeleteNoteConfirmOpen, setIsDeleteNoteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<LearnSavedNote | null>(
    null
  );
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<LearnEditableNote | null>(
    null
  );
  const [noteError, setNoteError] = useState<string | null>(null);

  const loadedCourseSlugRef = useRef<string | null>(null);
  const statsRefreshTimeoutRef = useRef<number | null>(null);

  const totalLessons = useMemo(
    () => modules.reduce((count, module) => count + module.lessons.length, 0),
    [modules]
  );
  const lessonTitleById = useMemo(() => {
    const nextLessonTitleById = new Map<string, string>();

    modules.forEach((module) => {
      module.lessons.forEach((lesson) => {
        nextLessonTitleById.set(lesson.lesson_id, lesson.lesson_title);
      });
    });

    return nextLessonTitleById;
  }, [modules]);

  const clearStatsRefreshTimeout = useCallback(() => {
    if (statsRefreshTimeoutRef.current !== null) {
      window.clearTimeout(statsRefreshTimeoutRef.current);
      statsRefreshTimeoutRef.current = null;
    }
  }, []);

  const initializeNotesStats = useCallback(() => {
    const defaultStats = getDefaultNotesStats(totalLessons);

    setNotesStats((previous) => ({
      ...previous,
      lessonsWithNotes: defaultStats.lessonsWithNotes,
    }));
  }, [totalLessons]);

  const applyServerNotesStats = useCallback((stats: LearnNotesStats) => {
    setNotesStats(stats);
  }, []);

  const loadNotesStats = useCallback(
    async (courseSlug: string) => {
      const defaultStats = getDefaultNotesStats(totalLessons);

      try {
        const response = await fetch(`/api/courses/${courseSlug}/notes/stats`, {
          cache: "no-store",
          credentials: "include",
        });

        if (response.ok) {
          const stats = (await response.json()) as {
            totalNotes?: number;
            lessonsWithNotes?: number;
            totalLessons?: number;
            lastUpdate?: string | null;
          };

          setNotesStats({
            totalNotes: stats.totalNotes || 0,
            lessonsWithNotes: `${stats.lessonsWithNotes || 0}/${stats.totalLessons || totalLessons}`,
            lastUpdate: stats.lastUpdate
              ? formatNoteTimestamp(stats.lastUpdate)
              : defaultStats.lastUpdate,
          });
          return;
        }

        if (response.status === 401 || response.status === 404) {
          setNotesStats(defaultStats);
        }
      } catch {
        setNotesStats(defaultStats);
      }
    },
    [totalLessons]
  );

  const scheduleNotesStatsRefresh = useCallback(() => {
    if (!slug) {
      return;
    }

    clearStatsRefreshTimeout();
    statsRefreshTimeoutRef.current = window.setTimeout(() => {
      void loadNotesStats(slug);
    }, 500);
  }, [clearStatsRefreshTimeout, loadNotesStats, slug]);

  const loadCourseNotes = useCallback(async (courseSlug: string) => {
    try {
      const response = await fetch(`/api/courses/${courseSlug}/notes`, {
        cache: "no-store",
        credentials: "include",
      });

      if (response.ok) {
        const notes = (await response.json()) as unknown[];
        const mappedNotes = notes
          .map(mapApiNoteToSavedNote)
          .filter((note): note is LearnSavedNote => note !== null)
          .map((note) => ({
            ...note,
            lessonTitle: lessonTitleById.get(note.lessonId),
          }));

        setSavedNotes(mappedNotes);
        loadedCourseSlugRef.current = courseSlug;
        return;
      }

      if (response.status === 401 || response.status === 404) {
        setSavedNotes([]);
        loadedCourseSlugRef.current = courseSlug;
      }
    } catch {
      setSavedNotes([]);
    }
  }, [lessonTitleById]);

  const updateNotesStatsOptimized = useCallback(
    async (operation: "create" | "update" | "delete", lessonId?: string) => {
      if (!slug) {
        return;
      }

      if (operation === "create" || operation === "delete") {
        setNotesStats((previous) => {
          const currentTotal = previous.totalNotes || 0;
          const nextTotal =
            operation === "create"
              ? currentTotal + 1
              : Math.max(0, currentTotal - 1);

          const previousLessonsWithNotes =
            parseInt(previous.lessonsWithNotes.split("/")[0] || "0", 10) || 0;

          let nextLessonsWithNotes = previousLessonsWithNotes;

          if (lessonId && operation === "create") {
            nextLessonsWithNotes = Math.min(
              previousLessonsWithNotes + 1,
              totalLessons
            );
          }

          if (lessonId && operation === "delete") {
            nextLessonsWithNotes = Math.max(previousLessonsWithNotes - 1, 0);
          }

          return {
            ...previous,
            totalNotes: nextTotal,
            lessonsWithNotes: `${nextLessonsWithNotes}/${totalLessons}`,
            lastUpdate: "Ahora",
          };
        });
      } else {
        setNotesStats((previous) => ({
          ...previous,
          lastUpdate: "Ahora",
        }));
      }

      scheduleNotesStatsRefresh();
    },
    [scheduleNotesStatsRefresh, slug, totalLessons]
  );

  const addNoteToLocalState = useCallback(
    (noteData: unknown, lessonId: string) => {
      const savedNote = buildSavedNoteFromMutation(noteData, lessonId);

      if (!savedNote) {
        return;
      }

      const enrichedNote: LearnSavedNote = {
        ...savedNote,
        lessonTitle: lessonTitleById.get(lessonId),
      };

      setSavedNotes((previous) => {
        const existingIndex = previous.findIndex(
          (note) => note.id === enrichedNote.id
        );

        if (existingIndex >= 0) {
          const updatedNotes = [...previous];
          updatedNotes[existingIndex] = enrichedNote;
          return updatedNotes;
        }

        return [enrichedNote, ...previous];
      });
    },
    [lessonTitleById]
  );

  const removeNoteFromLocalState = useCallback((noteId: string) => {
    setSavedNotes((previous) => previous.filter((note) => note.id !== noteId));
  }, []);

  const closeNotesModal = useCallback(() => {
    setIsNotesModalOpen(false);
    setEditingNote(null);
  }, []);

  const closeDeleteNoteConfirm = useCallback(() => {
    setIsDeleteNoteConfirmOpen(false);
    setNoteToDelete(null);
  }, []);

  const openNewNoteModal = useCallback(() => {
    setEditingNote(null);
    closeLia();
    setIsNotesModalOpen(true);
  }, [closeLia]);

  const openEditNoteModal = useCallback(
    (note: LearnSavedNote) => {
      setEditingNote({
        id: note.id,
        lessonId: note.lessonId,
        title: note.title,
        content: note.fullContent || note.content,
        tags: note.tags || [],
      });
      closeLia();
      setIsNotesModalOpen(true);
    },
    [closeLia]
  );

  const openLiaNoteModal = useCallback(
    (content: string) => {
      setEditingNote(
        buildLiaDraftNote(content, {
          lessonId: currentLesson?.lesson_id,
          lessonTitle: currentLesson?.lesson_title,
        })
      );
      closeLia();
      setIsNotesModalOpen(true);
    },
    [closeLia, currentLesson?.lesson_id, currentLesson?.lesson_title]
  );

  const handleSaveNote = useCallback(
    async (noteData: LearnNoteFormData) => {
      if (!slug) {
        setNoteError("No se pudo determinar el curso para guardar la nota");
        return false;
      }

      const notePayload = normalizeNoteFormData(noteData);
      const targetLessonId = editingNote?.lessonId || currentLesson?.lesson_id;

      try {
        if (editingNote?.id.trim()) {
          if (!targetLessonId) {
            setNoteError("No se pudo determinar la leccion de la nota a editar");
            return false;
          }

          const response = await fetch(
            `/api/courses/${slug}/lessons/${targetLessonId}/notes/${editingNote.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(notePayload),
            }
          );

          if (!response.ok) {
            const errorMessage = await readResponseError(
              response,
              "Error desconocido"
            );
            setNoteError(`Error al actualizar la nota: ${errorMessage}`);
            return false;
          }

          addNoteToLocalState(await response.json(), targetLessonId);
          await updateNotesStatsOptimized("update", targetLessonId);
          closeNotesModal();
          return true;
        }

        if (!targetLessonId) {
          setNoteError("Debe seleccionar una leccion para guardar la nota");
          return false;
        }

        const response = await fetch(
          `/api/courses/${slug}/lessons/${targetLessonId}/notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notePayload),
          }
        );

        if (!response.ok) {
          const errorMessage = await readResponseError(
            response,
            "Error desconocido"
          );
          setNoteError(`Error al guardar la nota: ${errorMessage}`);
          return false;
        }

        addNoteToLocalState(await response.json(), targetLessonId);
        await updateNotesStatsOptimized("create", targetLessonId);
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
      slug,
      updateNotesStatsOptimized,
    ]
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      const note = savedNotes.find((savedNote) => savedNote.id === noteId);
      setNoteToDelete(note || null);
      setIsDeleteNoteConfirmOpen(true);
    },
    [savedNotes]
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
      if (isDeletingEditingNote) {
        closeNotesModal();
      }

      removeNoteFromLocalState(noteToDelete.id);
      await updateNotesStatsOptimized("delete", targetLessonId);

      const response = await fetchWithTimeout(
        `/api/courses/${slug}/lessons/${targetLessonId}/notes/${noteToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
        NOTE_DELETE_TIMEOUT_MS
      );

      if (!response.ok) {
        await loadCourseNotes(slug);
        await loadNotesStats(slug);

        const errorMessage = await readResponseError(
          response,
          "Error desconocido"
        );
        setNoteError(`Error al eliminar la nota: ${errorMessage}`);
      }

      closeDeleteNoteConfirm();
    } catch (error) {
      await loadCourseNotes(slug);
      await loadNotesStats(slug);
      closeDeleteNoteConfirm();
      setNoteError(
        isAbortError(error)
          ? "La eliminacion de la nota tardó demasiado. Intenta de nuevo."
          : "Error al eliminar la nota. Por favor, intenta de nuevo."
      );
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
    slug,
    updateNotesStatsOptimized,
  ]);

  useEffect(() => {
    if (!slug) {
      setSavedNotes([]);
      loadedCourseSlugRef.current = null;
      return;
    }

    if (
      loadedCourseSlugRef.current &&
      loadedCourseSlugRef.current !== slug
    ) {
      setSavedNotes([]);
      loadedCourseSlugRef.current = null;
    }

    if (isNotesCollapsed || loadedCourseSlugRef.current === slug) {
      return;
    }

    void loadCourseNotes(slug);
  }, [isNotesCollapsed, loadCourseNotes, slug]);

  useEffect(() => clearStatsRefreshTimeout, [clearStatsRefreshTimeout]);

  return {
    addNoteToLocalState,
    applyServerNotesStats,
    closeDeleteNoteConfirm,
    closeNotesModal,
    confirmDeleteNote,
    editingNote,
    handleDeleteNote,
    handleSaveNote,
    initializeNotesStats,
    isDeleteNoteConfirmOpen,
    isDeletingNote,
    isNotesModalOpen,
    noteError,
    setNoteError,
    notesStats,
    openEditNoteModal,
    openLiaNoteModal,
    openNewNoteModal,
    savedNotes,
    updateNotesStatsOptimized,
  };
}
