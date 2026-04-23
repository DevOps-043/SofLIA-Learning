"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { LearnSavedNote } from "../../components/learn/types";
import { mapApiNoteToSavedNote } from "../../components/learn/notes/utils";

type UseCourseNotesLoaderParams = {
  slug: string;
  isNotesCollapsed: boolean;
  lessonTitleById: Map<string, string>;
  loadedCourseSlugRef: MutableRefObject<string | null>;
  setSavedNotes: Dispatch<SetStateAction<LearnSavedNote[]>>;
};

export function useCourseNotesLoader({
  slug,
  isNotesCollapsed,
  lessonTitleById,
  loadedCourseSlugRef,
  setSavedNotes,
}: UseCourseNotesLoaderParams) {
  const loadCourseNotes = useCallback(
    async (courseSlug: string) => {
      try {
        const response = await fetch(`/api/courses/${courseSlug}/notes`, {
          cache: "no-store",
          credentials: "include",
        });

        if (response.ok) {
          setSavedNotes(mapCourseNotes(await response.json(), lessonTitleById));
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
    },
    [lessonTitleById, loadedCourseSlugRef, setSavedNotes]
  );

  useEffect(() => {
    if (!slug) {
      setSavedNotes([]);
      loadedCourseSlugRef.current = null;
      return;
    }

    if (loadedCourseSlugRef.current && loadedCourseSlugRef.current !== slug) {
      setSavedNotes([]);
      loadedCourseSlugRef.current = null;
    }

    if (isNotesCollapsed || loadedCourseSlugRef.current === slug) return;

    void loadCourseNotes(slug);
  }, [isNotesCollapsed, loadCourseNotes, loadedCourseSlugRef, setSavedNotes, slug]);

  return { loadCourseNotes };
}

function mapCourseNotes(data: unknown, lessonTitleById: Map<string, string>) {
  return (Array.isArray(data) ? data : [])
    .map(mapApiNoteToSavedNote)
    .filter((note): note is LearnSavedNote => note !== null)
    .map((note) => ({
      ...note,
      lessonTitle: lessonTitleById.get(note.lessonId),
    }));
}
