"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

type UseLessonSidebarExpansionParams = {
  expandedLessons: Set<string>;
  loadLessonActivitiesAndMaterials: (
    lessonId: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  setExpandedLessons: Dispatch<SetStateAction<Set<string>>>;
  setExpandedModules: Dispatch<SetStateAction<Set<string>>>;
};

export function useLessonSidebarExpansion({
  expandedLessons,
  loadLessonActivitiesAndMaterials,
  setExpandedLessons,
  setExpandedModules,
}: UseLessonSidebarExpansionParams) {
  const toggleLessonExpand = useCallback(
    async (lessonId: string) => {
      if (!expandedLessons.has(lessonId)) {
        await loadLessonActivitiesAndMaterials(lessonId);
      }

      setExpandedLessons((previous) => toggleExpandedId(previous, lessonId));
    },
    [expandedLessons, loadLessonActivitiesAndMaterials, setExpandedLessons]
  );

  const toggleModuleExpand = useCallback((moduleId: string) => {
    setExpandedModules((previous) => toggleExpandedId(previous, moduleId));
  }, [setExpandedModules]);

  return { toggleLessonExpand, toggleModuleExpand };
}

function toggleExpandedId(previous: Set<string>, itemId: string) {
  const next = new Set(previous);
  if (next.has(itemId)) {
    next.delete(itemId);
  } else {
    next.add(itemId);
  }
  return next;
}
