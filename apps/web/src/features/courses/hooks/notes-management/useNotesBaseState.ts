"use client";

import { useMemo, useRef, useState } from "react";

import type {
  LearnEditableNote,
  LearnModule,
  LearnNotesStats,
  LearnSavedNote,
} from "../../components/learn/types";

export function useNotesBaseState(modules: LearnModule[]) {
  const [savedNotes, setSavedNotes] = useState<LearnSavedNote[]>([]);
  const [notesStats, setNotesStats] = useState<LearnNotesStats>({
    totalNotes: 0,
    lessonsWithNotes: "0/0",
    lastUpdate: "-",
  });
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isDeleteNoteConfirmOpen, setIsDeleteNoteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<LearnSavedNote | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<LearnEditableNote | null>(null);
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

  return {
    editingNote,
    isDeleteNoteConfirmOpen,
    isDeletingNote,
    isNotesModalOpen,
    lessonTitleById,
    loadedCourseSlugRef,
    noteError,
    notesStats,
    noteToDelete,
    savedNotes,
    setEditingNote,
    setIsDeleteNoteConfirmOpen,
    setIsDeletingNote,
    setIsNotesModalOpen,
    setNoteError,
    setNotesStats,
    setNoteToDelete,
    setSavedNotes,
    statsRefreshTimeoutRef,
    totalLessons,
  };
}
