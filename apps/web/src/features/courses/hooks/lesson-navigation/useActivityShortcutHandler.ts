"use client";

import { useCallback } from "react";
import type { LearnActivityMap, LearnLesson, LearnOrderedLesson, LearnTab } from "../../components/learn/types";
import { findOrderedLessonIndex, getPendingRequiredActivities, isLessonVideoCompleted } from "../lessonNavigation.utils";
import { scrollToTop } from "./lesson-navigation.dom";
import type { ActivityShortcutTarget, OpenLessonOptions, PendingValidationRef, TrackUserAction } from "./lesson-navigation.types";
import { trackActivityShortcutOpened, trackActivityShortcutVideoBlock } from "./activity-shortcut.helpers";
import { redirectToPendingActivities } from "./activity-shortcut-pending";
import { runActivityShortcutValidation } from "./activity-shortcut-validation";

interface UseActivityShortcutHandlerParams {
  cancelPendingValidation: () => void;
  currentLesson: LearnLesson | null;
  lessonsActivities: LearnActivityMap;
  markLessonAsCompleted: (lessonId: string, signal?: AbortSignal) => Promise<boolean>;
  onActivityFocus?: (contentId: string, contentType?: "activity" | "material") => void;
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
  orderedLessons: LearnOrderedLesson[];
  pendingValidationRef: PendingValidationRef;
  saveCurrentLessonVideoProgress: (lessonId?: string | null) => void;
  setActiveTab: (tab: LearnTab) => void;
  showIncompleteVideoModal: () => void;
  trackUserAction: TrackUserAction;
}

export function useActivityShortcutHandler(params: UseActivityShortcutHandlerParams) {
  const {
    cancelPendingValidation, currentLesson, lessonsActivities, markLessonAsCompleted,
    onActivityFocus, openLesson, orderedLessons, pendingValidationRef,
    saveCurrentLessonVideoProgress, setActiveTab, showIncompleteVideoModal, trackUserAction,
  } = params;

  const openShortcut = useCallback((target: ActivityShortcutTarget) => {
    openLesson(target.lesson, { tab: "activities" });
    onActivityFocus?.(target.activityId, target.contentType);
    trackActivityShortcutOpened(trackUserAction, target.activityId, target.lesson);
  }, [onActivityFocus, openLesson, trackUserAction]);

  return useCallback(async (target: ActivityShortcutTarget) => {
    const { activityId, contentType = "activity", lesson } = target;
    cancelPendingValidation();

    if (!currentLesson) {
      openShortcut({ activityId, contentType, lesson });
      return;
    }

    const isCurrentLesson = currentLesson.lesson_id === lesson.lesson_id;
    if (isCurrentLesson) {
      if (!isLessonVideoCompleted(currentLesson)) {
        trackActivityShortcutVideoBlock(trackUserAction, activityId, currentLesson);
        showIncompleteVideoModal();
        return;
      }

      setActiveTab("activities");
      onActivityFocus?.(activityId, contentType);
      scrollToTop();
      trackActivityShortcutOpened(trackUserAction, activityId, lesson);
      return;
    }

    const currentIndex = findOrderedLessonIndex(orderedLessons, currentLesson.lesson_id);
    const selectedIndex = findOrderedLessonIndex(orderedLessons, lesson.lesson_id);
    if (selectedIndex === -1) return;

    if (selectedIndex <= currentIndex) {
      openShortcut({ activityId, contentType, lesson });
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

    openLesson(lesson, { tab: "activities" });
    onActivityFocus?.(activityId, contentType);

    const abortController = new AbortController();
    pendingValidationRef.current = abortController;
    await runActivityShortcutValidation({
      abortController,
      activityId,
      markLessonAsCompleted,
      openLesson,
      pendingValidationRef,
      previousLesson: currentLesson,
      targetLesson: lesson,
      trackUserAction,
    });
  }, [cancelPendingValidation, currentLesson, lessonsActivities, markLessonAsCompleted, onActivityFocus, openLesson, openShortcut, orderedLessons, pendingValidationRef, saveCurrentLessonVideoProgress, setActiveTab, showIncompleteVideoModal, trackUserAction]);
}
