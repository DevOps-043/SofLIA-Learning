"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  LearnModule,
  LearnNoteListItem,
  LearnSavedNote,
} from "../../components/learn/types";
import {
  buildSavedNoteFromMutation,
  mapApiNoteToSavedNote,
} from "../../components/learn/notes/utils";

interface UseCourseNotesParams {
  lessonTitleById: Map<string, string>;
  modules: LearnModule[];
  organizationId?: string | null;
}

export function useCourseNotes({
  lessonTitleById,
  modules,
  organizationId,
}: UseCourseNotesParams) {
  const [manualNotes, setManualNotes] = useState<LearnSavedNote[]>([]);
  const loadedCourseSlugRef = useRef<string | null>(null);
  const loadedModulesKeyRef = useRef<string>("");
  const loadRequestIdRef = useRef(0);
  const modulesKey = useMemo(
    () => modules.map((module) => module.module_id).join(","),
    [modules]
  );

  const loadCourseNotes = useCallback(async (courseSlug: string) => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;
    const isCurrentRequest = () => loadRequestIdRef.current === requestId;

    try {
      const query = new URLSearchParams();
      if (organizationId) query.set("orgId", organizationId);
      const queryString = query.toString();
      const notesResponse = await fetch(`/api/courses/${courseSlug}/notes${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (notesResponse.ok) {
        const notes = (await notesResponse.json()) as unknown[];
        const mappedNotes = notes
          .map(mapApiNoteToSavedNote)
          .filter((note): note is LearnSavedNote => note !== null)
          .map(note => ({
            ...note,
            lessonTitle: lessonTitleById.get(note.lessonId),
          }));

        if (isCurrentRequest()) {
          setManualNotes(mappedNotes);
          loadedCourseSlugRef.current = courseSlug;
          loadedModulesKeyRef.current = modulesKey;
        }
      }

      if (
        isCurrentRequest() &&
        (notesResponse.status === 401 || notesResponse.status === 404)
      ) {
        setManualNotes([]);
        loadedCourseSlugRef.current = courseSlug;
        loadedModulesKeyRef.current = modulesKey;
      }
    } catch {
      if (isCurrentRequest()) {
        setManualNotes([]);
      }
    }
  }, [lessonTitleById, modulesKey, organizationId]);

  const savedNotes = useMemo<LearnNoteListItem[]>(
    () => manualNotes,
    [manualNotes]
  );

  const addNoteToLocalState = useCallback(
    (noteData: unknown, lessonId: string) => {
      const savedNote = buildSavedNoteFromMutation(noteData, lessonId);
      if (!savedNote) return;

      const enrichedNote: LearnSavedNote = {
        ...savedNote,
        lessonTitle: lessonTitleById.get(lessonId),
      };

      setManualNotes(previous => {
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
        loadRequestIdRef.current += 1;
        setManualNotes([]);
        loadedCourseSlugRef.current = null;
        loadedModulesKeyRef.current = "";
        return;
      }

      const hasLoadedDifferentCourse =
        loadedCourseSlugRef.current && loadedCourseSlugRef.current !== slug;
      const hasLoadedDifferentModules =
        loadedCourseSlugRef.current === slug &&
        loadedModulesKeyRef.current !== modulesKey;

      if (hasLoadedDifferentCourse || hasLoadedDifferentModules) {
        loadRequestIdRef.current += 1;
        setManualNotes([]);
        loadedCourseSlugRef.current = null;
        loadedModulesKeyRef.current = "";
      }

      if (!isNotesCollapsed && loadedCourseSlugRef.current !== slug) {
        void loadCourseNotes(slug);
      }
    },
    [loadCourseNotes, modulesKey]
  );

  return {
    addNoteToLocalState,
    ensureCourseNotesLoaded,
    loadCourseNotes,
    manualNotes,
    removeNoteFromLocalState: (noteId: string) => {
      setManualNotes(previous => previous.filter(note => note.id !== noteId));
    },
    savedNotes,
  };
}
