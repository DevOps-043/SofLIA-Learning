"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { LearnSavedNote } from "../../components/learn/types";
import { buildSavedNoteFromMutation } from "../../components/learn/notes/utils";

type UseNoteLocalActionsParams = {
  lessonTitleById: Map<string, string>;
  setSavedNotes: Dispatch<SetStateAction<LearnSavedNote[]>>;
};

export function useNoteLocalActions({
  lessonTitleById,
  setSavedNotes,
}: UseNoteLocalActionsParams) {
  const addNoteToLocalState = useCallback(
    (noteData: unknown, lessonId: string) => {
      const savedNote = buildSavedNoteFromMutation(noteData, lessonId);
      if (!savedNote) return;

      const enrichedNote: LearnSavedNote = {
        ...savedNote,
        lessonTitle: lessonTitleById.get(lessonId),
      };

      setSavedNotes((previous) => {
        const existingIndex = previous.findIndex((note) => note.id === enrichedNote.id);
        if (existingIndex < 0) return [enrichedNote, ...previous];

        const updatedNotes = [...previous];
        updatedNotes[existingIndex] = enrichedNote;
        return updatedNotes;
      });
    },
    [lessonTitleById, setSavedNotes]
  );

  const removeNoteFromLocalState = useCallback(
    (noteId: string) => {
      setSavedNotes((previous) => previous.filter((note) => note.id !== noteId));
    },
    [setSavedNotes]
  );

  return { addNoteToLocalState, removeNoteFromLocalState };
}
