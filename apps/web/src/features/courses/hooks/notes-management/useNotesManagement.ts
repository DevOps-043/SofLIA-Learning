"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LearnGeneratedModuleSummary,
  LearnNoteFormData,
  LearnNoteListItem,
  LearnSavedNote,
} from "../../components/learn/types";
import { useCourseNotes } from "./useCourseNotes";
import { useDeleteNoteMutation } from "./useDeleteNoteMutation";
import { useNoteModalState } from "./useNoteModalState";
import { useNotesStats } from "./useNotesStats";
import { usePersistNoteMutation } from "./usePersistNoteMutation";
import { useSaveNoteMutation } from "./useSaveNoteMutation";
import type { UseNotesManagementParams } from "./types";

export function useNotesManagement({
  slug,
  modules,
  currentLesson,
  isNotesCollapsed,
  closeLia,
  organizationId,
}: UseNotesManagementParams) {
  const [noteError, setNoteError] = useState<string | null>(null);
  const [regeneratingSummaryModuleId, setRegeneratingSummaryModuleId] =
    useState<string | null>(null);
  const [viewingGeneratedSummaryId, setViewingGeneratedSummaryId] =
    useState<string | null>(null);
  const totalLessons = useMemo(
    () => modules.reduce((count, module) => count + module.lessons.length, 0),
    [modules]
  );
  const lessonTitleById = useMemo(() => {
    const nextLessonTitleById = new Map<string, string>();
    modules.forEach(module => {
      module.lessons.forEach(lesson => {
        nextLessonTitleById.set(lesson.lesson_id, lesson.lesson_title);
      });
    });
    return nextLessonTitleById;
  }, [modules]);
  const moduleTitleById = useMemo(() => {
    const nextModuleTitleById = new Map<string, string>();
    modules.forEach(module => {
      nextModuleTitleById.set(module.module_id, module.module_title);
    });
    return nextModuleTitleById;
  }, [modules]);

  const notes = useCourseNotes({
    lessonTitleById,
    moduleTitleById,
    modules,
    organizationId,
  });
  const stats = useNotesStats({ slug, totalLessons });
  const modals = useNoteModalState({ closeLia, currentLesson });
  const handleSaveNote = useSaveNoteMutation({
    addNoteToLocalState: notes.addNoteToLocalState,
    closeNotesModal: modals.closeNotesModal,
    currentLesson,
    editingNote: modals.editingNote,
    loadCourseNotes: notes.loadCourseNotes,
    loadNotesStats: stats.loadNotesStats,
    organizationId,
    setNoteError,
    slug,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized as (
      operation: "create" | "update",
      lessonId?: string
    ) => Promise<void>,
  }) as (noteData: LearnNoteFormData) => Promise<boolean>;
  const persistNote = usePersistNoteMutation({
    addNoteToLocalState: notes.addNoteToLocalState,
    currentLesson,
    editingNote: modals.editingNote,
    loadCourseNotes: notes.loadCourseNotes,
    organizationId,
    setNoteError,
    slug,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized as (
      operation: "create" | "update",
      lessonId?: string
    ) => Promise<void>,
  });
  const deleteNotes = useDeleteNoteMutation({
    closeNotesModal: modals.closeNotesModal,
    currentLesson,
    editingNote: modals.editingNote,
    loadCourseNotes: notes.loadCourseNotes,
    loadNotesStats: stats.loadNotesStats,
    removeNoteFromLocalState: notes.removeNoteFromLocalState,
    savedNotes: notes.manualNotes,
    setNoteError,
    slug,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized as (
      operation: "delete",
      lessonId?: string
    ) => Promise<void>,
  });

  useEffect(() => {
    notes.ensureCourseNotesLoaded(slug, isNotesCollapsed);
  }, [isNotesCollapsed, notes.ensureCourseNotesLoaded, slug]);

  const generatedSummaryVersions = notes.generatedSummaryVersions;
  const viewingGeneratedSummary = useMemo(
    () =>
      generatedSummaryVersions.find(
        (summary) => summary.id === viewingGeneratedSummaryId
      ) || null,
    [generatedSummaryVersions, viewingGeneratedSummaryId]
  );
  const viewingSummaryVersions = useMemo(() => {
    if (!viewingGeneratedSummary) {
      return [];
    }

    return generatedSummaryVersions.filter(
      (summary) => summary.moduleId === viewingGeneratedSummary.moduleId
    );
  }, [generatedSummaryVersions, viewingGeneratedSummary]);
  const viewingSummaryIndex = viewingGeneratedSummary
    ? viewingSummaryVersions.findIndex(
        (summary) => summary.id === viewingGeneratedSummary.id
      )
    : -1;

  const openEditNoteModal = useCallback(
    (note: LearnNoteListItem) => {
      if (note.kind === "module_learning_summary") {
        setViewingGeneratedSummaryId(note.id);
        closeLia();
        return;
      }

      if (note.kind === "module_learning_summary_candidate") {
        return;
      }

      modals.openEditNoteModal(note as LearnSavedNote);
    },
    [closeLia, modals]
  );

  const closeGeneratedSummaryViewer = useCallback(() => {
    setViewingGeneratedSummaryId(null);
  }, []);

  const duplicateGeneratedSummary = useCallback(
    (summary: LearnGeneratedModuleSummary) => {
      modals.openDraftNoteModal({
        id: "",
        title: summary.title,
        content: summary.fullContent,
        tags: ["SofLIA", "Apunte"],
      });
      setViewingGeneratedSummaryId(null);
    },
    [modals]
  );

  const refreshSummaries = useCallback(async () => {
    await notes.loadCourseNotes(slug);
  }, [notes.loadCourseNotes, slug]);

  const requestModuleSummary = useCallback(
    async (
      moduleId: string,
      generationType: "default" | "manual_regeneration"
    ) => {
      setRegeneratingSummaryModuleId(moduleId);
      setNoteError(null);

      try {
        const response = await fetch(
          `/api/courses/${slug}/modules/${moduleId}/learning-summaries`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              generationType,
              organizationId: organizationId || null,
            }),
          }
        );
        const payload = (await response.json().catch(() => ({}))) as {
          summary?: unknown;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "No fue posible generar el apunte.");
        }

        await refreshSummaries();
      } catch (error) {
        setNoteError(
          error instanceof Error
            ? error.message
            : "No fue posible generar el apunte."
        );
      } finally {
        setRegeneratingSummaryModuleId(null);
      }
    },
    [organizationId, refreshSummaries, slug]
  );

  const generateDefaultSummary = useCallback(
    (moduleId: string) => {
      void requestModuleSummary(moduleId, "default");
    },
    [requestModuleSummary]
  );

  const regenerateSummary = useCallback(
    (moduleId: string) => {
      void requestModuleSummary(moduleId, "manual_regeneration");
    },
    [requestModuleSummary]
  );

  const navigateGeneratedSummary = useCallback(
    (direction: "previous" | "next") => {
      if (viewingSummaryIndex < 0) {
        return;
      }

      const nextIndex =
        direction === "previous"
          ? viewingSummaryIndex - 1
          : viewingSummaryIndex + 1;
      const nextSummary = viewingSummaryVersions[nextIndex];

      if (nextSummary) {
        setViewingGeneratedSummaryId(nextSummary.id);
      }
    },
    [viewingSummaryIndex, viewingSummaryVersions]
  );

  return {
    addNoteToLocalState: notes.addNoteToLocalState,
    applyServerNotesStats: stats.applyServerNotesStats,
    closeGeneratedSummaryViewer,
    closeDeleteNoteConfirm: deleteNotes.closeDeleteNoteConfirm,
    closeNotesModal: modals.closeNotesModal,
    confirmDeleteNote: deleteNotes.confirmDeleteNote,
    editingNote: modals.editingNote,
    duplicateGeneratedSummary,
    generatedSummaryVersions,
    generateDefaultSummary,
    handleDeleteNote: deleteNotes.handleDeleteNote,
    handleSaveNote,
    initializeNotesStats: stats.initializeNotesStats,
    isDeleteNoteConfirmOpen: deleteNotes.isDeleteNoteConfirmOpen,
    isDeletingNote: deleteNotes.isDeletingNote,
    isNotesModalOpen: modals.isNotesModalOpen,
    noteError,
    notesStats: stats.notesStats,
    persistNote,
    navigateGeneratedSummary,
    openEditNoteModal,
    openLiaNoteModal: modals.openLiaNoteModal,
    openNewNoteModal: modals.openNewNoteModal,
    savedNotes: notes.savedNotes,
    regenerateSummary,
    regeneratingSummaryModuleId,
    setNoteError,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized,
    viewingGeneratedSummary,
    viewingSummaryIndex,
    viewingSummaryVersions,
  };
}
