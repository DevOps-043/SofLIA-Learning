"use client";

import { useEffect, useMemo, useState } from "react";
import type { LearnNoteFormData } from "../../components/learn/types";
import { useCourseNotes } from "./useCourseNotes";
import { useDeleteNoteMutation } from "./useDeleteNoteMutation";
import { useNoteModalState } from "./useNoteModalState";
import { useNotesStats } from "./useNotesStats";
import { useSaveNoteMutation } from "./useSaveNoteMutation";
import type { UseNotesManagementParams } from "./types";

export function useNotesManagement({
  slug,
  modules,
  currentLesson,
  isNotesCollapsed,
  closeLia,
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

  const notes = useCourseNotes({ lessonTitleById });
  const stats = useNotesStats({ slug, totalLessons });
  const modals = useNoteModalState({ closeLia, currentLesson });
  const handleSaveNote = useSaveNoteMutation({
    addNoteToLocalState: notes.addNoteToLocalState,
    closeNotesModal: modals.closeNotesModal,
    currentLesson,
    editingNote: modals.editingNote,
    loadCourseNotes: notes.loadCourseNotes,
    loadNotesStats: stats.loadNotesStats,
    setNoteError,
    slug,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized as (
      operation: "create" | "update",
      lessonId?: string
    ) => Promise<void>,
  }) as (noteData: LearnNoteFormData) => Promise<boolean>;
  const deleteNotes = useDeleteNoteMutation({
    closeNotesModal: modals.closeNotesModal,
    currentLesson,
    editingNote: modals.editingNote,
    loadCourseNotes: notes.loadCourseNotes,
    loadNotesStats: stats.loadNotesStats,
    removeNoteFromLocalState: notes.removeNoteFromLocalState,
    savedNotes: notes.savedNotes,
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
    openEditNoteModal: modals.openEditNoteModal,
    openLiaNoteModal: modals.openLiaNoteModal,
    openNewNoteModal: modals.openNewNoteModal,
    savedNotes: notes.savedNotes,
    setNoteError,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized,
  };
}
