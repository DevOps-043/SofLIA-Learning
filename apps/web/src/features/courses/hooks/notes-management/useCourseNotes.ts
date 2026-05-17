"use client";

import { useCallback, useRef, useState } from "react";
import type { LearnSavedNote } from "../../components/learn/types";
import {
  buildSavedNoteFromMutation,
  mapApiNoteToSavedNote,
} from "../../components/learn/notes/utils";

interface UseCourseNotesParams {
  lessonTitleById: Map<string, string>;
}

export function useCourseNotes({ lessonTitleById }: UseCourseNotesParams) {
  const [savedNotes, setSavedNotes] = useState<LearnSavedNote[]>([]);
  const loadedCourseSlugRef = useRef<string | null>(null);

  const loadCourseNotes = useCallback(async (courseSlug: string) => {
    try {
      const response = await fetch(`/api/courses/${courseSlug}/notes`, {
        cache: "no-store",
        credentials: "include",
      });

      if (response.ok) {
        const notes = (await response.json()) as unknown[];
        const mappedNotes = notes
          .map(mapApiNoteToSavedNote)
          .filter((note): note is LearnSavedNote => note !== null)
          .map(note => ({
            ...note,
            lessonTitle: lessonTitleById.get(note.lessonId),
          }));

        setSavedNotes(mappedNotes);
        loadedCourseSlugRef.current = courseSlug;
        return;
      }

      if (response.status === 401 || response.status === 404) {
        setSavedNotes([]);
        loadedCourseSlugRef.current = courseSlug;
      }
    } catch {
      setSavedNotes([]);
    }
  }, [lessonTitleById]);

  const addNoteToLocalState = useCallback(
    (noteData: unknown, lessonId: string) => {
      const savedNote = buildSavedNoteFromMutation(noteData, lessonId);
      if (!savedNote) return;

      const enrichedNote: LearnSavedNote = {
        ...savedNote,
        lessonTitle: lessonTitleById.get(lessonId),
      };

      setSavedNotes(previous => {
        const existingIndex = previous.findIndex(note => note.id === enrichedNote.id);
        if (existingIndex < 0) return [enrichedNote, ...previous];

        const updatedNotes = [...previous];
        updatedNotes[existingIndex] = enrichedNote;
        return updatedNotes;
      });
    },
    [lessonTitleById]
  );

  const ensureCourseNotesLoaded = useCallback(
    (slug: string, isNotesCollapsed: boolean) => {
      if (!slug) {
        setSavedNotes([]);
        loadedCourseSlugRef.current = null;
        return;
      }

      if (loadedCourseSlugRef.current && loadedCourseSlugRef.current !== slug) {
        setSavedNotes([]);
        loadedCourseSlugRef.current = null;
      }

      if (!isNotesCollapsed && loadedCourseSlugRef.current !== slug) {
        void loadCourseNotes(slug);
      }
    },
    [loadCourseNotes]
  );

  return {
    addNoteToLocalState,
    ensureCourseNotesLoaded,
    loadCourseNotes,
    removeNoteFromLocalState: (noteId: string) => {
      setSavedNotes(previous => previous.filter(note => note.id !== noteId));
    },
    savedNotes,
  };
}
