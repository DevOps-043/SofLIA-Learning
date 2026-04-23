"use client";

import { useCallback } from "react";

import type { LearnLesson } from "../../components/learn/types";
import {
  findOrderedLessonById,
  getNextOrderedLesson,
  getPreviousOrderedLesson,
} from "../lessonNavigation.utils";
import type { OpenLessonOptions, UseLessonNavigationParams } from "./types";

type UseLessonNavigationActionsParams = Pick<
  UseLessonNavigationParams,
  "currentLesson" | "orderedLessons"
> & {
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
};

export function useLessonNavigationActions({
  currentLesson,
  openLesson,
  orderedLessons,
}: UseLessonNavigationActionsParams) {
  const openLessonById = useCallback(
    (lessonId: string, options: OpenLessonOptions = {}) => {
      const lessonItem = findOrderedLessonById(orderedLessons, lessonId);
      if (!lessonItem) return false;

      openLesson(lessonItem.lesson, options);
      return true;
    },
    [openLesson, orderedLessons]
  );

  const getPreviousLesson = useCallback(
    () => getPreviousOrderedLesson(orderedLessons, currentLesson?.lesson_id),
    [currentLesson?.lesson_id, orderedLessons]
  );

  const getNextLesson = useCallback(
    () => getNextOrderedLesson(orderedLessons, currentLesson?.lesson_id),
    [currentLesson?.lesson_id, orderedLessons]
  );

  const navigateToPreviousLesson = useCallback(
    (cancelPendingValidation: () => void) => () => {
      cancelPendingValidation();

      const previousLesson = getPreviousLesson();
      if (previousLesson) openLesson(previousLesson);
    },
    [getPreviousLesson, openLesson]
  );

  return { getNextLesson, getPreviousLesson, navigateToPreviousLesson, openLessonById };
}
