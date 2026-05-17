"use client";

import { useCallback } from "react";
import type { LearnLesson } from "../../components/learn/types";
import { getPendingRequiredActivities, isLessonVideoCompleted } from "../lessonNavigation.utils";
import { scrollToTop } from "./browser";
import type { OpenLessonOptions, UseLessonNavigationParams } from "./types";

interface UseNextLessonNavigationParams {
  cancelPendingValidation: () => void;
  getNextLesson: () => LearnLesson | null;
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
  saveCurrentLessonVideoProgress: (lessonId?: string | null) => void;
  showIncompleteVideoModal: () => void;
}

export function useNextLessonNavigation(params: UseLessonNavigationParams & UseNextLessonNavigationParams) {
  const {
    cancelPendingValidation,
    currentLesson,
    getNextLesson,
    lessonsActivities,
    markLessonAsCompleted,
    openLesson,
    saveCurrentLessonVideoProgress,
    setActiveTab,
    showIncompleteVideoModal,
    trackUserAction,
  } = params;

  return useCallback(async () => {
    cancelPendingValidation();
    const nextLesson = getNextLesson();
    if (!nextLesson || !currentLesson) return;

    if (!isLessonVideoCompleted(currentLesson)) {
      trackUserAction("attempted_next_lesson_before_video_completed", {
        currentLessonId: currentLesson.lesson_id,
        currentLessonTitle: currentLesson.lesson_title,
        targetLessonId: nextLesson.lesson_id,
        targetLessonTitle: nextLesson.lesson_title,
      });
      showIncompleteVideoModal();
      return;
    }

    const pendingRequired = getPendingRequiredActivities(lessonsActivities[currentLesson.lesson_id]);
    if (pendingRequired.length > 0) {
      trackUserAction("redirected_to_pending_activities", {
        currentLessonId: currentLesson.lesson_id,
        currentLessonTitle: currentLesson.lesson_title,
        pendingActivities: pendingRequired.map(activity => activity.activity_title),
        pendingCount: pendingRequired.length,
      });
      saveCurrentLessonVideoProgress(currentLesson.lesson_id);
      setActiveTab("activities");
      scrollToTop();
      return;
    }

    if (await markLessonAsCompleted(currentLesson.lesson_id)) {
      openLesson(nextLesson);
    }
  }, [
    cancelPendingValidation,
    currentLesson,
    getNextLesson,
    lessonsActivities,
    markLessonAsCompleted,
    openLesson,
    saveCurrentLessonVideoProgress,
    setActiveTab,
    showIncompleteVideoModal,
    trackUserAction,
  ]);
}
