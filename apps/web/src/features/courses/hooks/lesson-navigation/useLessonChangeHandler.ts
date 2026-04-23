"use client";

import { useCallback } from "react";

import type { LearnLesson } from "../../components/learn/types";
import {
  findOrderedLessonIndex,
  getPendingRequiredActivities,
  isLessonVideoCompleted,
} from "../lessonNavigation.utils";
import { scrollToTop } from "./navigation-dom.utils";
import { openLessonAndValidatePrevious } from "./useLessonChangeValidation";
import type { OpenLessonOptions, PendingValidationRef, UseLessonNavigationParams } from "./types";

type UseLessonChangeHandlerParams = Pick<
  UseLessonNavigationParams,
  "currentLesson" | "lessonsActivities" | "markLessonAsCompleted" | "orderedLessons" | "setActiveTab" | "trackUserAction"
> & {
  cancelPendingValidation: () => void;
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
  pendingValidationRef: PendingValidationRef;
  saveCurrentLessonVideoProgress: (lessonId?: string | null) => void;
  showIncompleteVideoModal: () => void;
};

export function useLessonChangeHandler(params: UseLessonChangeHandlerParams) {
  return useCallback(async (lesson: LearnLesson) => {
    const currentLesson = params.currentLesson;
    if (currentLesson?.lesson_id === lesson.lesson_id) return;

    params.cancelPendingValidation();
    if (!currentLesson || shouldOpenWithoutForwardValidation(params.orderedLessons, currentLesson, lesson)) {
      params.openLesson(lesson);
      return;
    }

    if (!isLessonVideoCompleted(currentLesson)) {
      params.trackUserAction("attempted_lesson_change_before_video_completed", {
        currentLessonId: currentLesson.lesson_id,
        currentLessonTitle: currentLesson.lesson_title,
        targetLessonId: lesson.lesson_id,
        targetLessonTitle: lesson.lesson_title,
      });
      params.showIncompleteVideoModal();
      return;
    }

    const pendingRequired = getPendingRequiredActivities(params.lessonsActivities[currentLesson.lesson_id]);
    if (pendingRequired.length > 0) {
      params.trackUserAction("attempted_lesson_change_without_completion", {
        currentLessonId: currentLesson.lesson_id,
        currentLessonTitle: currentLesson.lesson_title,
        targetLessonId: lesson.lesson_id,
        targetLessonTitle: lesson.lesson_title,
        pendingActivities: pendingRequired.map((activity) => activity.activity_title).join(", "),
        pendingCount: pendingRequired.length,
      });
      params.saveCurrentLessonVideoProgress(currentLesson.lesson_id);
      params.setActiveTab("activities");
      scrollToTop();
      return;
    }

    params.trackUserAction("lesson_change", {
      from: currentLesson.lesson_title,
      to: lesson.lesson_title,
    });

    await openLessonAndValidatePrevious(params, currentLesson, lesson);
  }, [params]);
}

function shouldOpenWithoutForwardValidation(
  orderedLessons: UseLessonNavigationParams["orderedLessons"],
  currentLesson: LearnLesson,
  lesson: LearnLesson
) {
  const currentIndex = findOrderedLessonIndex(orderedLessons, currentLesson.lesson_id);
  const selectedIndex = findOrderedLessonIndex(orderedLessons, lesson.lesson_id);
  return selectedIndex === -1 || selectedIndex <= currentIndex;
}
