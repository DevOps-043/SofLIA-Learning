"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
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

  const notes = useCourseNotes({
    lessonTitleById,
    modules,
    organizationId,
  });
  const stats = useNotesStats({ organizationId, slug, totalLessons });
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
    organizationId,
    slug,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized as (
      operation: "delete",
      lessonId?: string
    ) => Promise<void>,
  });

  useEffect(() => {
    notes.ensureCourseNotesLoaded(slug, isNotesCollapsed);
  }, [isNotesCollapsed, notes.ensureCourseNotesLoaded, slug]);

  const refreshNotesAfterQuiz = useCallback(async () => {
    if (!slug || isNotesCollapsed) {
      return;
    }

    await Promise.all([
      notes.loadCourseNotes(slug),
      stats.loadNotesStats(slug),
    ]);
  }, [isNotesCollapsed, notes.loadCourseNotes, slug, stats.loadNotesStats]);

  const openEditNoteModal = useCallback(
    (note: LearnNoteListItem) => {
      modals.openEditNoteModal(note as LearnSavedNote);
    },
    [modals]
  );

  return {
    addNoteToLocalState: notes.addNoteToLocalState,
    applyServerNotesStats: stats.applyServerNotesStats,
    closeDeleteNoteConfirm: deleteNotes.closeDeleteNoteConfirm,
    closeNotesModal: modals.closeNotesModal,
    confirmDeleteNote: deleteNotes.confirmDeleteNote,
    editingNote: modals.editingNote,
    handleDeleteNote: deleteNotes.handleDeleteNote,
    handleSaveNote,
    initializeNotesStats: stats.initializeNotesStats,
    isDeleteNoteConfirmOpen: deleteNotes.isDeleteNoteConfirmOpen,
    isDeletingNote: deleteNotes.isDeletingNote,
    isNotesModalOpen: modals.isNotesModalOpen,
    noteError,
    notesStats: stats.notesStats,
    persistNote,
    openEditNoteModal,
    openLiaNoteModal: modals.openLiaNoteModal,
    openNewNoteModal: modals.openNewNoteModal,
    refreshNotesAfterQuiz,
    savedNotes: notes.savedNotes,
    setNoteError,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized,
  };
}
