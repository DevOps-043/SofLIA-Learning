"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  LearnEditableNote,
  LearnLesson,
  LearnModule,
  LearnNoteFormData,
  LearnNoteListItem,
  LearnNotesStats,
  LearnSavedNote,
  LearnGeneratedModuleSummary,
  LearnModuleSummaryCandidate,
} from "../components/learn/types";
import {
  buildLiaDraftNote,
  buildSavedNoteFromMutation,
  formatNoteTimestamp,
  getDefaultNotesStats,
  mapApiSummaryToGeneratedNote,
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

type ModuleLearningSummariesLoadResult = {
  listItems: Array<LearnGeneratedModuleSummary | LearnModuleSummaryCandidate>;
  summaries: LearnGeneratedModuleSummary[];
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

function isModuleCompleted(module: LearnModule): boolean {
  return (
    module.lessons.length > 0 &&
    module.lessons.every((lesson) => Boolean(lesson.is_completed))
  );
}

function buildModuleSummaryCandidate(
  module: LearnModule
): LearnModuleSummaryCandidate {
  return {
    kind: "module_learning_summary_candidate",
    id: `module-learning-summary-candidate-${module.module_id}`,
    moduleId: module.module_id,
    moduleTitle: module.module_title,
    title: `Apunte SofLIA: ${module.module_title}`,
    content: "",
    timestamp: "Ahora",
  };
}

function getLatestSummaryPerModule(
  summaries: LearnGeneratedModuleSummary[]
): LearnGeneratedModuleSummary[] {
  const latestSummaryByModuleId = new Map<string, LearnGeneratedModuleSummary>();

  summaries.forEach((summary) => {
    const currentLatest = latestSummaryByModuleId.get(summary.moduleId);

    if (!currentLatest || summary.version > currentLatest.version) {
      latestSummaryByModuleId.set(summary.moduleId, summary);
    }
  });

  return Array.from(latestSummaryByModuleId.values()).sort((left, right) => {
    const leftTitle = left.moduleTitle || left.title;
    const rightTitle = right.moduleTitle || right.title;
    return leftTitle.localeCompare(rightTitle);
  });
}

function buildModuleSummaryListItems(
  summaries: LearnGeneratedModuleSummary[],
  completedSummaryCandidates: LearnModuleSummaryCandidate[]
): Array<LearnGeneratedModuleSummary | LearnModuleSummaryCandidate> {
  const latestSummaries = getLatestSummaryPerModule(summaries);
  const summaryModuleIds = new Set(
    latestSummaries.map((summary) => summary.moduleId)
  );
  const missingDefaultCandidates = completedSummaryCandidates.filter(
    (candidate) => !summaryModuleIds.has(candidate.moduleId)
  );

  return [...latestSummaries, ...missingDefaultCandidates];
}

function upsertGeneratedSummaryVersion(
  summaries: LearnGeneratedModuleSummary[],
  nextSummary: LearnGeneratedModuleSummary
): LearnGeneratedModuleSummary[] {
  const existingIndex = summaries.findIndex(
    (summary) => summary.id === nextSummary.id
  );
  const nextSummaries =
    existingIndex >= 0
      ? summaries.map((summary, index) =>
          index === existingIndex ? nextSummary : summary
        )
      : [...summaries, nextSummary];

  return sortGeneratedSummaryVersions(nextSummaries);
}

function sortGeneratedSummaryVersions(
  summaries: LearnGeneratedModuleSummary[]
): LearnGeneratedModuleSummary[] {
  return [...summaries].sort((left, right) => {
    const moduleComparison = left.moduleId.localeCompare(right.moduleId);
    return moduleComparison || left.version - right.version;
  });
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
  const [savedNotes, setSavedNotes] = useState<LearnNoteListItem[]>([]);
  const [generatedSummaryVersions, setGeneratedSummaryVersions] = useState<
    LearnGeneratedModuleSummary[]
  >([]);
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
  const [viewingGeneratedSummary, setViewingGeneratedSummary] =
    useState<LearnGeneratedModuleSummary | null>(null);
  const [regeneratingSummaryModuleId, setRegeneratingSummaryModuleId] =
    useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const loadedCourseSlugRef = useRef<string | null>(null);
  const completedSummaryCandidateSignatureRef = useRef<string>("");
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
  const moduleTitleById = useMemo(() => {
    const nextModuleTitleById = new Map<string, string>();

    modules.forEach((module) => {
      nextModuleTitleById.set(module.module_id, module.module_title);
    });

    return nextModuleTitleById;
  }, [modules]);
  const completedSummaryCandidates = useMemo(
    () => modules.filter(isModuleCompleted).map(buildModuleSummaryCandidate),
    [modules]
  );
  const completedSummaryCandidateSignature = useMemo(
    () =>
      completedSummaryCandidates
        .map((candidate) => candidate.moduleId)
        .sort()
        .join("|"),
    [completedSummaryCandidates]
  );
  const hasGeneratingModuleSummary = useMemo(
    () =>
      savedNotes.some(
        (note) =>
          note.kind === "module_learning_summary" &&
          note.status === "generating"
      ),
    [savedNotes]
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

  const loadModuleLearningSummaries = useCallback(
    async (courseSlug: string): Promise<ModuleLearningSummariesLoadResult> => {
      if (modules.length === 0) {
        return { listItems: [], summaries: [] };
      }

      try {
        const moduleIds = modules
          .map((module) => module.module_id)
          .filter(Boolean)
          .join(",");
        const response = await fetch(
          `/api/courses/${courseSlug}/learning-summaries?moduleIds=${encodeURIComponent(
            moduleIds
          )}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!response.ok) {
          return { listItems: completedSummaryCandidates, summaries: [] };
        }

        const payload = (await response.json()) as {
          summaries?: unknown[];
        };
        const summaries = (payload.summaries || [])
          .map((summary) => mapApiSummaryToGeneratedNote(summary, moduleTitleById))
          .filter(
            (summary): summary is LearnGeneratedModuleSummary =>
              summary !== null
          );

        return {
          listItems: buildModuleSummaryListItems(
            summaries,
            completedSummaryCandidates
          ),
          summaries,
        };
      } catch {
        return { listItems: completedSummaryCandidates, summaries: [] };
      }
    },
    [completedSummaryCandidates, moduleTitleById, modules]
  );

  const loadCourseNotes = useCallback(async (courseSlug: string) => {
    try {
      const [response, generatedSummariesResult] = await Promise.all([
        fetch(`/api/courses/${courseSlug}/notes`, {
        cache: "no-store",
        credentials: "include",
        }),
        loadModuleLearningSummaries(courseSlug),
      ]);
      setGeneratedSummaryVersions(
        sortGeneratedSummaryVersions(generatedSummariesResult.summaries)
      );

      if (response.ok) {
        const notes = (await response.json()) as unknown[];
        const mappedNotes = notes
          .map(mapApiNoteToSavedNote)
          .filter((note): note is LearnSavedNote => note !== null)
          .map((note) => ({
            ...note,
            lessonTitle: lessonTitleById.get(note.lessonId),
          }));

        setSavedNotes([...generatedSummariesResult.listItems, ...mappedNotes]);
        loadedCourseSlugRef.current = courseSlug;
        return;
      }

      if (response.status === 401 || response.status === 404) {
        setSavedNotes(generatedSummariesResult.listItems);
        loadedCourseSlugRef.current = courseSlug;
      }
    } catch {
      setSavedNotes([]);
      setGeneratedSummaryVersions([]);
    }
  }, [lessonTitleById, loadModuleLearningSummaries]);

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
          (note) =>
            note.kind !== "module_learning_summary" &&
            note.kind !== "module_learning_summary_candidate" &&
            note.id === enrichedNote.id
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
    setSavedNotes((previous) =>
      previous.filter(
        (note) =>
          note.kind === "module_learning_summary" ||
          note.kind === "module_learning_summary_candidate" ||
          note.id !== noteId
      )
    );
  }, []);

  const closeNotesModal = useCallback(() => {
    setIsNotesModalOpen(false);
    setEditingNote(null);
    setViewingGeneratedSummary(null);
  }, []);

  const closeDeleteNoteConfirm = useCallback(() => {
    setIsDeleteNoteConfirmOpen(false);
    setNoteToDelete(null);
  }, []);

  const openNewNoteModal = useCallback(() => {
    setEditingNote(null);
    setViewingGeneratedSummary(null);
    closeLia();
    setIsNotesModalOpen(true);
  }, [closeLia]);

  const openEditNoteModal = useCallback(
    (note: LearnNoteListItem) => {
      if (note.kind === "module_learning_summary") {
        setEditingNote(null);
        setViewingGeneratedSummary(note);
        closeLia();
        setIsNotesModalOpen(true);
        return;
      }

      if (note.kind === "module_learning_summary_candidate") {
        return;
      }

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

  const duplicateGeneratedSummary = useCallback(
    (summary: LearnGeneratedModuleSummary) => {
      setViewingGeneratedSummary(null);
      setEditingNote({
        id: "",
        title: summary.title,
        content: summary.fullContent,
        tags: ["SofLIA", "Apunte"],
      });
      closeLia();
      setIsNotesModalOpen(true);
    },
    [closeLia]
  );

  const openLiaNoteModal = useCallback(
    (content: string) => {
      setViewingGeneratedSummary(null);
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
      const note = savedNotes.find(
        (savedNote) =>
          savedNote.kind !== "module_learning_summary" &&
          savedNote.kind !== "module_learning_summary_candidate" &&
          savedNote.id === noteId
      ) as LearnSavedNote | undefined;
      setNoteToDelete(note || null);
      setIsDeleteNoteConfirmOpen(true);
    },
    [savedNotes]
  );

  const generateModuleSummary = useCallback(
    async (
      moduleId: string,
      generationType: "default" | "manual_regeneration" = "manual_regeneration"
    ) => {
      if (!slug || regeneratingSummaryModuleId) {
        return false;
      }

      setRegeneratingSummaryModuleId(moduleId);

      try {
        const response = await fetch(
          `/api/courses/${slug}/modules/${moduleId}/learning-summaries`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ generationType }),
          }
        );
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          summary?: unknown;
        };

        if (!response.ok) {
          setNoteError(payload.error || "No fue posible regenerar el apunte");
          return false;
        }

        const generatedSummary = mapApiSummaryToGeneratedNote(
          payload.summary,
          moduleTitleById
        );

        if (generatedSummary) {
          setGeneratedSummaryVersions((previous) =>
            upsertGeneratedSummaryVersion(previous, generatedSummary)
          );
          setSavedNotes((previous) => [
            generatedSummary,
            ...previous.filter(
              (note) =>
                !(
                  (note.kind === "module_learning_summary_candidate" &&
                    note.moduleId === moduleId) ||
                  (note.kind === "module_learning_summary" &&
                    note.moduleId === moduleId)
                )
            ),
          ]);
          setViewingGeneratedSummary(generatedSummary);
          setIsNotesModalOpen(true);
        }

        return true;
      } catch {
        setNoteError("No fue posible regenerar el apunte");
        return false;
      } finally {
        setRegeneratingSummaryModuleId(null);
      }
    },
    [moduleTitleById, regeneratingSummaryModuleId, slug]
  );
  const regenerateModuleSummary = useCallback(
    (moduleId: string) => generateModuleSummary(moduleId, "manual_regeneration"),
    [generateModuleSummary]
  );
  const generateDefaultModuleSummary = useCallback(
    (moduleId: string) => generateModuleSummary(moduleId, "default"),
    [generateModuleSummary]
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
      setGeneratedSummaryVersions([]);
      loadedCourseSlugRef.current = null;
      return;
    }

    if (
      loadedCourseSlugRef.current &&
      loadedCourseSlugRef.current !== slug
    ) {
      setSavedNotes([]);
      setGeneratedSummaryVersions([]);
      loadedCourseSlugRef.current = null;
    }

    if (
      completedSummaryCandidateSignatureRef.current !==
      completedSummaryCandidateSignature
    ) {
      completedSummaryCandidateSignatureRef.current =
        completedSummaryCandidateSignature;
      loadedCourseSlugRef.current = null;
    }

    if (isNotesCollapsed || loadedCourseSlugRef.current === slug) {
      return;
    }

    void loadCourseNotes(slug);
  }, [
    completedSummaryCandidateSignature,
    isNotesCollapsed,
    loadCourseNotes,
    slug,
  ]);

  useEffect(() => {
    if (!slug || isNotesCollapsed || !hasGeneratingModuleSummary) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadCourseNotes(slug);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [hasGeneratingModuleSummary, isNotesCollapsed, loadCourseNotes, slug]);

  useEffect(() => {
    if (!viewingGeneratedSummary) {
      return;
    }

    const updatedSummary = generatedSummaryVersions.find(
      (note): note is LearnGeneratedModuleSummary =>
        note.id === viewingGeneratedSummary.id
    );

    if (
      updatedSummary &&
      updatedSummary.updatedAt !== viewingGeneratedSummary.updatedAt
    ) {
      setViewingGeneratedSummary(updatedSummary);
    }
  }, [generatedSummaryVersions, viewingGeneratedSummary]);

  useEffect(() => clearStatsRefreshTimeout, [clearStatsRefreshTimeout]);

  return {
    addNoteToLocalState,
    applyServerNotesStats,
    closeDeleteNoteConfirm,
    closeNotesModal,
    confirmDeleteNote,
    duplicateGeneratedSummary,
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
    generateDefaultModuleSummary,
    generatedSummaryVersions,
    regenerateModuleSummary,
    regeneratingSummaryModuleId,
    savedNotes,
    updateNotesStatsOptimized,
    viewingGeneratedSummary,
  };
}
