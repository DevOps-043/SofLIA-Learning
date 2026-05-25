"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { LearnLesson, LearnOrderedLesson, LearnTab } from "../../components/learn/types";
import { findOrderedLessonById, getNextOrderedLesson, getPreviousOrderedLesson } from "../lessonNavigation.utils";
import { scrollToTop } from "./lesson-navigation.dom";
import type { OpenLessonOptions, PauseAllVideosContext, TrackUserAction } from "./lesson-navigation.types";

interface UseLessonOpeningParams {
  currentLesson: LearnLesson | null;
  orderedLessons: LearnOrderedLesson[];
  saveCurrentLessonVideoProgress: (lessonId?: string | null) => void;
  setActiveTab: Dispatch<SetStateAction<LearnTab>>;
  setCurrentLesson: Dispatch<SetStateAction<LearnLesson | null>>;
  trackUserAction: TrackUserAction;
  videoPlayerContext?: PauseAllVideosContext;
}

export function useLessonOpening({
  currentLesson,
  orderedLessons,
  saveCurrentLessonVideoProgress,
  setActiveTab,
  setCurrentLesson,
  trackUserAction,
  videoPlayerContext,
}: UseLessonOpeningParams) {
  const openLesson = useCallback((lesson: LearnLesson, options: OpenLessonOptions = {}) => {
    if (currentLesson?.lesson_id && currentLesson.lesson_id !== lesson.lesson_id) {
      saveCurrentLessonVideoProgress(currentLesson.lesson_id);
    }

    videoPlayerContext?.pauseAllVideos?.();
    setCurrentLesson(lesson);
    setActiveTab(options.tab ?? "video");
    scrollToTop();

    if (options.trackOpen !== false) {
      trackUserAction("lesson_opened", { lessonId: lesson.lesson_id, lessonTitle: lesson.lesson_title });
    }
  }, [currentLesson?.lesson_id, saveCurrentLessonVideoProgress, setActiveTab, setCurrentLesson, trackUserAction, videoPlayerContext]);

  const openLessonById = useCallback((lessonId: string, options: OpenLessonOptions = {}) => {
    const lessonItem = findOrderedLessonById(orderedLessons, lessonId);
    if (!lessonItem) return false;

    openLesson(lessonItem.lesson, options);
    return true;
  }, [openLesson, orderedLessons]);

  const getPreviousLesson = useCallback(
    () => getPreviousOrderedLesson(orderedLessons, currentLesson?.lesson_id),
    [currentLesson?.lesson_id, orderedLessons],
  );
  const getNextLesson = useCallback(
    () => getNextOrderedLesson(orderedLessons, currentLesson?.lesson_id),
    [currentLesson?.lesson_id, orderedLessons],
  );

  return { getNextLesson, getPreviousLesson, openLesson, openLessonById };
}
