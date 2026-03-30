"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  LearnEditableNote,
  LearnLesson,
  LearnNoteFormData,
  LearnNotesStats,
  LearnSavedNote,
  LearnModule,
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
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<LearnEditableNote | null>(null);

  const loadedLessonIdRef = useRef<string | null>(null);
  const statsRefreshTimeoutRef = useRef<number | null>(null);

  const totalLessons = useMemo(
    () => modules.reduce((count, module) => count + module.lessons.length, 0),
    [modules]
  );

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

  const loadLessonNotes = useCallback(
    async (lessonId: string, courseSlug: string) => {
      try {
        const response = await fetch(
          `/api/courses/${courseSlug}/lessons/${lessonId}/notes`,
          { credentials: "include" }
        );

        if (response.ok) {
          const notes = (await response.json()) as unknown[];
          const mappedNotes = notes
            .map(mapApiNoteToSavedNote)
            .filter((note): note is LearnSavedNote => note !== null);

          setSavedNotes(mappedNotes);
          loadedLessonIdRef.current = lessonId;
          return;
        }

        if (response.status === 401) {
          setSavedNotes([]);
          loadedLessonIdRef.current = lessonId;
        }
      } catch {
        setSavedNotes([]);
        loadedLessonIdRef.current = lessonId;
      }
    },
    []
  );

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

  const addNoteToLocalState = useCallback((noteData: unknown, lessonId: string) => {
    const savedNote = buildSavedNoteFromMutation(noteData, lessonId);

    if (!savedNote) {
      return;
    }

    setSavedNotes((previous) => {
      const existingIndex = previous.findIndex((note) => note.id === savedNote.id);

      if (existingIndex >= 0) {
        const updatedNotes = [...previous];
        updatedNotes[existingIndex] = savedNote;
        return updatedNotes;
      }

      return [savedNote, ...previous];
    });
  }, []);

  const removeNoteFromLocalState = useCallback((noteId: string) => {
    setSavedNotes((previous) => previous.filter((note) => note.id !== noteId));
  }, []);

  const closeNotesModal = useCallback(() => {
    setIsNotesModalOpen(false);
    setEditingNote(null);
  }, []);

  const closeDeleteNoteConfirm = useCallback(() => {
    setIsDeleteNoteConfirmOpen(false);
    setNoteToDeleteId(null);
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
      setEditingNote(buildLiaDraftNote(content));
      closeLia();
      setIsNotesModalOpen(true);
    },
    [closeLia]
  );

  const handleSaveNote = useCallback(
    async (noteData: LearnNoteFormData) => {
      if (!currentLesson?.lesson_id || !slug) {
        alert("Debe seleccionar una leccion para guardar la nota");
        return;
      }

      const notePayload = normalizeNoteFormData(noteData);

      try {
        if (editingNote?.id.trim()) {
          const response = await fetch(
            `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes/${editingNote.id}`,
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
            alert(`Error al actualizar la nota: ${errorMessage}`);
            return;
          }

          addNoteToLocalState(await response.json(), currentLesson.lesson_id);
          await updateNotesStatsOptimized("update", currentLesson.lesson_id);
          closeNotesModal();
          return;
        }

        const response = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes`,
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
          alert(`Error al guardar la nota: ${errorMessage}`);
          throw new Error(errorMessage);
        }

        addNoteToLocalState(await response.json(), currentLesson.lesson_id);
        await updateNotesStatsOptimized("create", currentLesson.lesson_id);
        closeNotesModal();
      } catch {
        await loadLessonNotes(currentLesson.lesson_id, slug);
        await loadNotesStats(slug);
      }
    },
    [
      addNoteToLocalState,
      closeNotesModal,
      currentLesson?.lesson_id,
      editingNote?.id,
      loadLessonNotes,
      loadNotesStats,
      slug,
      updateNotesStatsOptimized,
    ]
  );

  const handleDeleteNote = useCallback((noteId: string) => {
    setNoteToDeleteId(noteId);
    setIsDeleteNoteConfirmOpen(true);
  }, []);

  const confirmDeleteNote = useCallback(async () => {
    if (!noteToDeleteId || !currentLesson?.lesson_id || !slug) {
      return;
    }

    setIsDeletingNote(true);

    try {
      removeNoteFromLocalState(noteToDeleteId);
      await updateNotesStatsOptimized("delete", currentLesson.lesson_id);

      const response = await fetch(
        `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes/${noteToDeleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        await loadLessonNotes(currentLesson.lesson_id, slug);
        await loadNotesStats(slug);

        const errorMessage = await readResponseError(
          response,
          "Error desconocido"
        );
        alert(`Error al eliminar la nota: ${errorMessage}`);
      }

      closeDeleteNoteConfirm();
    } catch {
      await loadLessonNotes(currentLesson.lesson_id, slug);
      await loadNotesStats(slug);
      alert("Error al eliminar la nota. Por favor, intenta de nuevo.");
    } finally {
      setIsDeletingNote(false);
    }
  }, [
    closeDeleteNoteConfirm,
    currentLesson?.lesson_id,
    loadLessonNotes,
    loadNotesStats,
    noteToDeleteId,
    removeNoteFromLocalState,
    slug,
    updateNotesStatsOptimized,
  ]);

  useEffect(() => {
    const lessonId = currentLesson?.lesson_id;

    if (!lessonId) {
      setSavedNotes([]);
      loadedLessonIdRef.current = null;
      return;
    }

    if (loadedLessonIdRef.current && loadedLessonIdRef.current !== lessonId) {
      setSavedNotes([]);
      loadedLessonIdRef.current = null;
    }

    if (isNotesCollapsed || !slug || loadedLessonIdRef.current === lessonId) {
      return;
    }

    void loadLessonNotes(lessonId, slug);
  }, [currentLesson?.lesson_id, isNotesCollapsed, loadLessonNotes, slug]);

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
    notesStats,
    openEditNoteModal,
    openLiaNoteModal,
    openNewNoteModal,
    savedNotes,
    updateNotesStatsOptimized,
  };
}
