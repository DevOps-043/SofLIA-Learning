"use client";

import { useCallback, useState } from "react";
import type {
  LearnEditableNote,
  LearnLesson,
  LearnSavedNote,
} from "../../components/learn/types";
import { buildLiaDraftNote } from "../../components/learn/notes/utils";

interface UseNoteModalStateParams {
  closeLia: () => void;
  currentLesson: LearnLesson | null;
}

export function useNoteModalState({
  closeLia,
  currentLesson,
}: UseNoteModalStateParams) {
  const [editingNote, setEditingNote] = useState<LearnEditableNote | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const closeNotesModal = useCallback(() => {
    setIsNotesModalOpen(false);
    setEditingNote(null);
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

  const openDraftNoteModal = useCallback(
    (note: LearnEditableNote) => {
      setEditingNote(note);
      closeLia();
      setIsNotesModalOpen(true);
    },
    [closeLia]
  );

  return {
    closeNotesModal,
    editingNote,
    isNotesModalOpen,
    openEditNoteModal,
    openDraftNoteModal,
    openLiaNoteModal,
    openNewNoteModal,
  };
}
