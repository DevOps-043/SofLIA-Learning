"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
  LearnEditableNote,
  LearnLesson,
  LearnSavedNote,
} from "../../components/learn/types";
import { buildLiaDraftNote } from "../../components/learn/notes/utils";

type UseNoteModalActionsParams = {
  closeLia: () => void;
  currentLesson: LearnLesson | null;
  setEditingNote: Dispatch<SetStateAction<LearnEditableNote | null>>;
  setIsDeleteNoteConfirmOpen: Dispatch<SetStateAction<boolean>>;
  setIsNotesModalOpen: Dispatch<SetStateAction<boolean>>;
  setNoteToDelete: Dispatch<SetStateAction<LearnSavedNote | null>>;
};

export function useNoteModalActions({
  closeLia,
  currentLesson,
  setEditingNote,
  setIsDeleteNoteConfirmOpen,
  setIsNotesModalOpen,
  setNoteToDelete,
}: UseNoteModalActionsParams) {
  const closeNotesModal = useCallback(() => {
    setIsNotesModalOpen(false);
    setEditingNote(null);
  }, [setEditingNote, setIsNotesModalOpen]);

  const closeDeleteNoteConfirm = useCallback(() => {
    setIsDeleteNoteConfirmOpen(false);
    setNoteToDelete(null);
  }, [setIsDeleteNoteConfirmOpen, setNoteToDelete]);

  const openNewNoteModal = useCallback(() => {
    setEditingNote(null);
    closeLia();
    setIsNotesModalOpen(true);
  }, [closeLia, setEditingNote, setIsNotesModalOpen]);

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
    [closeLia, setEditingNote, setIsNotesModalOpen]
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
    [closeLia, currentLesson?.lesson_id, currentLesson?.lesson_title, setEditingNote, setIsNotesModalOpen]
  );

  return {
    closeDeleteNoteConfirm,
    closeNotesModal,
    openEditNoteModal,
    openLiaNoteModal,
    openNewNoteModal,
  };
}
