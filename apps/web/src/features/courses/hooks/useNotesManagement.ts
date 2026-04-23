"use client";

import { useEffect } from "react";

import { useCourseNotesLoader, useDeleteNoteAction, useNoteLocalActions, useNoteModalActions, useNotesBaseState, useNotesStatsActions, useSaveNoteAction, type UseNotesManagementParams } from "./notes-management";

export function useNotesManagement({
  slug,
  modules,
  currentLesson,
  isNotesCollapsed,
  closeLia,
}: UseNotesManagementParams) {
  const state = useNotesBaseState(modules);
  const stats = useNotesStatsActions({
    slug,
    totalLessons: state.totalLessons,
    setNotesStats: state.setNotesStats,
    statsRefreshTimeoutRef: state.statsRefreshTimeoutRef,
  });
  const localActions = useNoteLocalActions({
    lessonTitleById: state.lessonTitleById,
    setSavedNotes: state.setSavedNotes,
  });
  const modalActions = useNoteModalActions({
    closeLia,
    currentLesson,
    setEditingNote: state.setEditingNote,
    setIsDeleteNoteConfirmOpen: state.setIsDeleteNoteConfirmOpen,
    setIsNotesModalOpen: state.setIsNotesModalOpen,
    setNoteToDelete: state.setNoteToDelete,
  });
  const { loadCourseNotes } = useCourseNotesLoader({
    isNotesCollapsed,
    lessonTitleById: state.lessonTitleById,
    loadedCourseSlugRef: state.loadedCourseSlugRef,
    setSavedNotes: state.setSavedNotes,
    slug,
  });
  const handleSaveNote = useSaveNoteAction({
    addNoteToLocalState: localActions.addNoteToLocalState,
    closeNotesModal: modalActions.closeNotesModal,
    currentLesson,
    editingNote: state.editingNote,
    loadCourseNotes,
    loadNotesStats: stats.loadNotesStats,
    setNoteError: state.setNoteError,
    slug,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized,
  });
  const deleteActions = useDeleteNoteAction({
    closeDeleteNoteConfirm: modalActions.closeDeleteNoteConfirm,
    closeNotesModal: modalActions.closeNotesModal,
    currentLesson,
    editingNote: state.editingNote,
    loadCourseNotes,
    loadNotesStats: stats.loadNotesStats,
    noteToDelete: state.noteToDelete,
    removeNoteFromLocalState: localActions.removeNoteFromLocalState,
    savedNotes: state.savedNotes,
    setIsDeleteNoteConfirmOpen: state.setIsDeleteNoteConfirmOpen,
    setIsDeletingNote: state.setIsDeletingNote,
    setNoteError: state.setNoteError,
    setNoteToDelete: state.setNoteToDelete,
    slug,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized,
  });

  useEffect(() => stats.clearStatsRefreshTimeout, [stats.clearStatsRefreshTimeout]);

  return {
    addNoteToLocalState: localActions.addNoteToLocalState,
    applyServerNotesStats: stats.applyServerNotesStats,
    closeDeleteNoteConfirm: modalActions.closeDeleteNoteConfirm,
    closeNotesModal: modalActions.closeNotesModal,
    confirmDeleteNote: deleteActions.confirmDeleteNote,
    editingNote: state.editingNote,
    handleDeleteNote: deleteActions.handleDeleteNote,
    handleSaveNote,
    initializeNotesStats: stats.initializeNotesStats,
    isDeleteNoteConfirmOpen: state.isDeleteNoteConfirmOpen,
    isDeletingNote: state.isDeletingNote,
    isNotesModalOpen: state.isNotesModalOpen,
    noteError: state.noteError,
    setNoteError: state.setNoteError,
    notesStats: state.notesStats,
    openEditNoteModal: modalActions.openEditNoteModal,
    openLiaNoteModal: modalActions.openLiaNoteModal,
    openNewNoteModal: modalActions.openNewNoteModal,
    savedNotes: state.savedNotes,
    updateNotesStatsOptimized: stats.updateNotesStatsOptimized,
  };
}
