"use client";

import { useCallback, useEffect, useRef } from "react";

import { useLessonChangeHandler } from "./lesson-navigation/useLessonChangeHandler";
import { useLessonNavigationActions } from "./lesson-navigation/useLessonNavigationActions";
import { useLessonOpener } from "./lesson-navigation/useLessonOpener";
import { useLessonPreloader } from "./lesson-navigation/useLessonPreloader";
import { useNextLessonNavigation } from "./lesson-navigation/useNextLessonNavigation";
import type { UseLessonNavigationParams } from "./lesson-navigation/types";

export function useLessonNavigation({
  orderedLessons,
  modules,
  currentLesson,
  lessonsActivities,
  lessonsMaterials,
  setCurrentLesson,
  setActiveTab,
  markLessonAsCompleted,
  loadLessonActivitiesAndMaterials,
  openValidationModal,
  trackUserAction,
  videoPlayerContext,
}: UseLessonNavigationParams) {
  const pendingValidationRef = useRef<AbortController | null>(null);

  const cancelPendingValidation = useCallback(() => {
    pendingValidationRef.current?.abort();
    pendingValidationRef.current = null;
  }, []);
  const opener = useLessonOpener({
    currentLesson,
    openValidationModal,
    setActiveTab,
    setCurrentLesson,
    trackUserAction,
    videoPlayerContext,
  });
  const actions = useLessonNavigationActions({
    currentLesson,
    openLesson: opener.openLesson,
    orderedLessons,
  });
  const handleLessonChange = useLessonChangeHandler({
    cancelPendingValidation,
    currentLesson,
    lessonsActivities,
    markLessonAsCompleted,
    openLesson: opener.openLesson,
    orderedLessons,
    pendingValidationRef,
    saveCurrentLessonVideoProgress: opener.saveCurrentLessonVideoProgress,
    setActiveTab,
    showIncompleteVideoModal: opener.showIncompleteVideoModal,
    trackUserAction,
  });
  const navigateToNextLesson = useNextLessonNavigation({
    cancelPendingValidation,
    currentLesson,
    getNextLesson: actions.getNextLesson,
    lessonsActivities,
    markLessonAsCompleted,
    openLesson: opener.openLesson,
    saveCurrentLessonVideoProgress: opener.saveCurrentLessonVideoProgress,
    setActiveTab,
    showIncompleteVideoModal: opener.showIncompleteVideoModal,
    trackUserAction,
  });

  useLessonPreloader({
    currentLesson,
    lessonsActivities,
    lessonsMaterials,
    loadLessonActivitiesAndMaterials,
    modules,
  });

  useEffect(() => cancelPendingValidation, [cancelPendingValidation]);

  return {
    getPreviousLesson: actions.getPreviousLesson,
    getNextLesson: actions.getNextLesson,
    handleLessonChange,
    navigateToPreviousLesson: actions.navigateToPreviousLesson(cancelPendingValidation),
    navigateToNextLesson,
    openLessonById: actions.openLessonById,
  };
}
