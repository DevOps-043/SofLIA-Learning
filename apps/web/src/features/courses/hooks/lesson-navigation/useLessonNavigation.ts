"use client";

import { useCallback, useEffect, useRef } from "react";
import { useActivityShortcut } from "./useActivityShortcut";
import { useLessonChange } from "./useLessonChange";
import { useLessonCoreNavigation } from "./useLessonCoreNavigation";
import { useNextLessonNavigation } from "./useNextLessonNavigation";
import { usePreloadLessonContent } from "./usePreloadLessonContent";
import type { UseLessonNavigationParams } from "./types";

export function useLessonNavigation(params: UseLessonNavigationParams) {
  const pendingValidationRef = useRef<AbortController | null>(null);
  const core = useLessonCoreNavigation(params, pendingValidationRef);
  const handleLessonChange = useLessonChange({ ...params, ...core, pendingValidationRef });
  const handleActivityShortcut = useActivityShortcut({ ...params, ...core, pendingValidationRef });
  const navigateToNextLesson = useNextLessonNavigation({ ...params, ...core });

  const navigateToPreviousLesson = useCallback(() => {
    core.cancelPendingValidation();
    const previousLesson = core.getPreviousLesson();
    if (previousLesson) {
      core.openLesson(previousLesson);
    }
  }, [core]);

  usePreloadLessonContent(params);
  useEffect(() => core.cancelPendingValidation, [core.cancelPendingValidation]);

  return {
    getPreviousLesson: core.getPreviousLesson,
    getNextLesson: core.getNextLesson,
    handleActivityShortcut,
    handleLessonChange,
    navigateToPreviousLesson,
    navigateToNextLesson,
    openLessonById: core.openLessonById,
  };
}
