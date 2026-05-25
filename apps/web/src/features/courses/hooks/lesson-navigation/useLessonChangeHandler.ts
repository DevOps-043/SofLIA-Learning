"use client";

import { useCallback } from "react";
import type { LearnActivityMap, LearnLesson, LearnOrderedLesson } from "../../components/learn/types";
import { findOrderedLessonIndex, getPendingRequiredActivities, isLessonVideoCompleted } from "../lessonNavigation.utils";
import { scrollToTop } from "./lesson-navigation.dom";
import type { OpenLessonOptions, PendingValidationRef, TrackUserAction } from "./lesson-navigation.types";
import { runCompletionValidation } from "./completion-validation";

interface UseLessonChangeHandlerParams {
  cancelPendingValidation: () => void;
  currentLesson: LearnLesson | null;
  lessonsActivities: LearnActivityMap;
  markLessonAsCompleted: (lessonId: string, signal?: AbortSignal) => Promise<boolean>;
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
  orderedLessons: LearnOrderedLesson[];
  pendingValidationRef: PendingValidationRef;
  saveCurrentLessonVideoProgress: (lessonId?: string | null) => void;
  setActiveTab: (tab: "activities") => void;
  showIncompleteVideoModal: () => void;
  trackUserAction: TrackUserAction;
}

export function useLessonChangeHandler({
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
  trackUserAction,
}: UseLessonChangeHandlerParams) {
  return useCallback(async (lesson: LearnLesson) => {
    if (currentLesson?.lesson_id === lesson.lesson_id) return;

    cancelPendingValidation();

    if (!currentLesson) {
      openLesson(lesson);
      return;
    }

    const currentIndex = findOrderedLessonIndex(orderedLessons, currentLesson.lesson_id);
    const selectedIndex = findOrderedLessonIndex(orderedLessons, lesson.lesson_id);

    if (selectedIndex === -1 || selectedIndex <= currentIndex) {
      openLesson(lesson);
      return;
    }

    if (!isLessonVideoCompleted(currentLesson)) {
      trackUserAction("attempted_lesson_change_before_video_completed", {
        currentLessonId: currentLesson.lesson_id,
        currentLessonTitle: currentLesson.lesson_title,
        targetLessonId: lesson.lesson_id,
        targetLessonTitle: lesson.lesson_title,
      });
      showIncompleteVideoModal();
      return;
    }

    const pendingRequired = getPendingRequiredActivities(lessonsActivities[currentLesson.lesson_id]);

    if (pendingRequired.length > 0) {
      trackUserAction("attempted_lesson_change_without_completion", {
        currentLessonId: currentLesson.lesson_id,
        currentLessonTitle: currentLesson.lesson_title,
        targetLessonId: lesson.lesson_id,
        targetLessonTitle: lesson.lesson_title,
        pendingActivities: pendingRequired.map(activity => activity.activity_title).join(", "),
        pendingCount: pendingRequired.length,
      });
      saveCurrentLessonVideoProgress(currentLesson.lesson_id);
      setActiveTab("activities");
      scrollToTop();
      return;
    }

    trackUserAction("lesson_change", { from: currentLesson.lesson_title, to: lesson.lesson_title });
    const previousLesson = currentLesson;
    openLesson(lesson);

    const abortController = new AbortController();
    pendingValidationRef.current = abortController;
    await runCompletionValidation({ abortController, markLessonAsCompleted, openLesson, pendingValidationRef, previousLesson, targetLesson: lesson, trackUserAction });
  }, [cancelPendingValidation, currentLesson, lessonsActivities, markLessonAsCompleted, openLesson, orderedLessons, pendingValidationRef, saveCurrentLessonVideoProgress, setActiveTab, showIncompleteVideoModal, trackUserAction]);
}
