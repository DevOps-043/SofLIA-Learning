"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  LearnGeneratedModuleSummary,
  LearnModule,
  LearnModuleSummaryCandidate,
  LearnNoteListItem,
  LearnSavedNote,
} from "../../components/learn/types";
import {
  buildSavedNoteFromMutation,
  mapApiNoteToSavedNote,
  mapApiSummaryToGeneratedNote,
} from "../../components/learn/notes/utils";

interface UseCourseNotesParams {
  lessonTitleById: Map<string, string>;
  moduleTitleById: Map<string, string>;
  modules: LearnModule[];
  organizationId?: string | null;
}

function buildModuleSummaryCandidate(module: LearnModule): LearnModuleSummaryCandidate | null {
  if (module.lessons.length === 0) {
    return null;
  }

  const isCompleted = module.lessons.every((lesson) => Boolean(lesson.is_completed));
  if (!isCompleted) {
    return null;
  }

  return {
    kind: "module_learning_summary_candidate",
    id: `module-summary-candidate:${module.module_id}`,
    moduleId: module.module_id,
    moduleTitle: module.module_title,
    title: `Apunte SofLIA: ${module.module_title}`,
    content: "",
    timestamp: "Ahora",
  };
}

function getLatestSummaryByModule(
  summaries: LearnGeneratedModuleSummary[]
): LearnGeneratedModuleSummary[] {
  const latestByModule = new Map<string, LearnGeneratedModuleSummary>();

  summaries.forEach((summary) => {
    const current = latestByModule.get(summary.moduleId);
    if (!current || summary.version > current.version) {
      latestByModule.set(summary.moduleId, summary);
    }
  });

  return Array.from(latestByModule.values()).sort((left, right) => {
    const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
    const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function useCourseNotes({
  lessonTitleById,
  moduleTitleById,
  modules,
  organizationId,
}: UseCourseNotesParams) {
  const [manualNotes, setManualNotes] = useState<LearnSavedNote[]>([]);
  const [generatedSummaryVersions, setGeneratedSummaryVersions] = useState<
    LearnGeneratedModuleSummary[]
  >([]);
  const [summariesLoaded, setSummariesLoaded] = useState(false);
  const loadedCourseSlugRef = useRef<string | null>(null);
  const loadedModulesKeyRef = useRef<string>("");
  const modulesKey = useMemo(
    () => modules.map((module) => module.module_id).join(","),
    [modules]
  );

  const loadCourseNotes = useCallback(async (courseSlug: string) => {
    setSummariesLoaded(false);
    const moduleIds = modules.map((module) => module.module_id).filter(Boolean);
    const summaryParams = new URLSearchParams();
    if (moduleIds.length > 0) {
      summaryParams.set("moduleIds", moduleIds.join(","));
    }
    if (organizationId) {
      summaryParams.set("orgId", organizationId);
    }

    try {
      const notesResponse = await fetch(`/api/courses/${courseSlug}/notes`, {
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

        setManualNotes(mappedNotes);
        loadedCourseSlugRef.current = courseSlug;
        loadedModulesKeyRef.current = modulesKey;
      }

      if (notesResponse.status === 401 || notesResponse.status === 404) {
        setManualNotes([]);
        loadedCourseSlugRef.current = courseSlug;
        loadedModulesKeyRef.current = modulesKey;
      }
    } catch {
      setManualNotes([]);
    }

    try {
      const summariesResponse = await fetch(
        `/api/courses/${courseSlug}/learning-summaries${
          summaryParams.toString() ? `?${summaryParams.toString()}` : ""
        }`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );
      if (summariesResponse.ok) {
        const payload = (await summariesResponse.json()) as { summaries?: unknown[] };
        const summaries = (payload.summaries || [])
          .map((summary) => mapApiSummaryToGeneratedNote(summary, moduleTitleById))
          .filter(
            (summary): summary is LearnGeneratedModuleSummary => summary !== null
          )
          .sort((left, right) => left.version - right.version);

        setGeneratedSummaryVersions(summaries);
      } else if (summariesResponse.status === 401 || summariesResponse.status === 404) {
        setGeneratedSummaryVersions([]);
      }
    } catch {
      setGeneratedSummaryVersions([]);
    } finally {
      setSummariesLoaded(true);
    }
  }, [lessonTitleById, moduleTitleById, modules, modulesKey, organizationId]);

  const latestGeneratedSummaries = useMemo(
    () => getLatestSummaryByModule(generatedSummaryVersions),
    [generatedSummaryVersions]
  );

  const summaryCandidates = useMemo(() => {
    if (!summariesLoaded) {
      return [];
    }

    const modulesWithSummaries = new Set(
      latestGeneratedSummaries.map((summary) => summary.moduleId)
    );

    return modules
      .filter((module) => !modulesWithSummaries.has(module.module_id))
      .map(buildModuleSummaryCandidate)
      .filter(
        (candidate): candidate is LearnModuleSummaryCandidate =>
          candidate !== null
      );
  }, [latestGeneratedSummaries, modules, summariesLoaded]);

  const savedNotes = useMemo<LearnNoteListItem[]>(
    () => [...latestGeneratedSummaries, ...summaryCandidates, ...manualNotes],
    [latestGeneratedSummaries, manualNotes, summaryCandidates]
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
        setManualNotes([]);
        setGeneratedSummaryVersions([]);
        setSummariesLoaded(false);
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
        setManualNotes([]);
        setGeneratedSummaryVersions([]);
        setSummariesLoaded(false);
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
    generatedSummaryVersions,
    ensureCourseNotesLoaded,
    loadCourseNotes,
    manualNotes,
    removeNoteFromLocalState: (noteId: string) => {
      setManualNotes(previous => previous.filter(note => note.id !== noteId));
    },
    setGeneratedSummaryVersions,
    savedNotes,
  };
}
