"use client";

import { useCallback } from "react";
import { findOrderedLessonIndex, getPendingRequiredActivities, isLessonVideoCompleted } from "../lessonNavigation.utils";
import { redirectToPendingActivities } from "./activity-shortcut-pending";
import { completeActivityShortcut } from "./activity-shortcut-completion";
import { trackActivityShortcutOpened, trackActivityShortcutVideoBlock } from "./activity-shortcut.helpers";
import type { ActivityShortcutTarget, UseActivityShortcutParams, UseLessonNavigationParams } from "./types";

export function useActivityShortcut(params: UseLessonNavigationParams & UseActivityShortcutParams) {
  const {
    cancelPendingValidation,
    currentLesson,
    lessonsActivities,
    markLessonAsCompleted,
    onActivityFocus,
    openLesson,
    orderedLessons,
    pendingValidationRef,
    saveCurrentLessonVideoProgress,
    setActiveTab,
    showIncompleteVideoModal,
    trackUserAction,
  } = params;

  const trackOpened = useCallback((target: ActivityShortcutTarget) => {
    onActivityFocus?.(target.activityId, target.contentType ?? "activity");
    trackActivityShortcutOpened(trackUserAction, target.activityId, target.lesson);
  }, [onActivityFocus, trackUserAction]);

  return useCallback(async (target: ActivityShortcutTarget) => {
    const { activityId, lesson } = target;
    cancelPendingValidation();

    if (!currentLesson) {
      openLesson(lesson, { tab: "activities" });
      trackOpened(target);
      return;
    }

    if (currentLesson.lesson_id === lesson.lesson_id) {
      if (!isLessonVideoCompleted(currentLesson)) {
        trackActivityShortcutVideoBlock(trackUserAction, activityId, currentLesson);
        showIncompleteVideoModal();
        return;
      }

      setActiveTab("activities");
      trackOpened(target);
      return;
    }

    const currentIndex = findOrderedLessonIndex(orderedLessons, currentLesson.lesson_id);
    const selectedIndex = findOrderedLessonIndex(orderedLessons, lesson.lesson_id);
    if (selectedIndex === -1) return;

    if (selectedIndex <= currentIndex) {
      openLesson(lesson, { tab: "activities" });
      trackOpened(target);
      return;
    }

    if (!isLessonVideoCompleted(currentLesson)) {
      trackActivityShortcutVideoBlock(trackUserAction, activityId, currentLesson, lesson);
      showIncompleteVideoModal();
      return;
    }

    const pendingRequired = getPendingRequiredActivities(lessonsActivities[currentLesson.lesson_id]);
    if (pendingRequired.length > 0) {
      redirectToPendingActivities({
        activityId,
        currentLesson,
        lesson,
        pendingRequired,
        saveCurrentLessonVideoProgress,
        setActiveTab,
        trackUserAction,
      });
      return;
    }

    await completeActivityShortcut({
      activityId,
      currentLesson,
      lesson,
      markLessonAsCompleted,
      onComplete: () => trackOpened(target),
      openLesson,
      pendingValidationRef,
      trackUserAction,
    });
  }, [
    cancelPendingValidation,
    currentLesson,
    lessonsActivities,
    markLessonAsCompleted,
    openLesson,
    orderedLessons,
    pendingValidationRef,
    saveCurrentLessonVideoProgress,
    setActiveTab,
    showIncompleteVideoModal,
    trackOpened,
    trackUserAction,
  ]);
}
