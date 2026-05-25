"use client";

import { useCallback } from "react";
import type { LearnLesson } from "../../components/learn/types";
import {
  findOrderedLessonIndex,
  getPendingRequiredActivities,
  isLessonVideoCompleted,
} from "../lessonNavigation.utils";
import { scrollToTop } from "./browser";
import { completePreviousLesson } from "./transition-validation";
import type { UseLessonChangeParams, UseLessonNavigationParams } from "./types";

export function useLessonChange(params: UseLessonNavigationParams & UseLessonChangeParams) {
  const {
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
  } = params;

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
    await completePreviousLesson({
      logMessage: "Error en validacion de cambio de leccion (ignorado):",
      markLessonAsCompleted,
      pendingValidationRef,
      previousLesson,
      onRejected: () => {
        openLesson(previousLesson, { trackOpen: false });
        trackUserAction("attempted_locked_lesson", {
          targetLessonId: lesson.lesson_id,
          targetLessonTitle: lesson.lesson_title,
          reason: "previous_lesson_not_completed",
        });
      },
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
    trackUserAction,
  ]);
}
