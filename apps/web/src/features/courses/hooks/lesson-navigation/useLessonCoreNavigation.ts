"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { LearnLesson } from "../../components/learn/types";
import {
  findOrderedLessonById,
  getNextOrderedLesson,
  getPreviousOrderedLesson,
} from "../lessonNavigation.utils";
import { scrollToTop } from "./browser";
import type { OpenLessonOptions, PendingValidationRef, UseLessonNavigationParams } from "./types";

export function useLessonCoreNavigation(
  params: UseLessonNavigationParams,
  pendingValidationRef: PendingValidationRef
) {
  const { t } = useTranslation("learn");
  const {
    currentLesson,
    orderedLessons,
    openValidationModal,
    setActiveTab,
    setCurrentLesson,
    trackUserAction,
    videoPlayerContext,
  } = params;

  const cancelPendingValidation = useCallback(() => {
    pendingValidationRef.current?.abort();
    pendingValidationRef.current = null;
  }, [pendingValidationRef]);

  const saveCurrentLessonVideoProgress = useCallback((lessonId?: string | null) => {
    if (!lessonId) return;
    const currentVideoElement = document.querySelector(".aspect-video video") as HTMLVideoElement | null;
    if (!currentVideoElement) return;
    videoPlayerContext?.saveVideoProgress?.(lessonId, currentVideoElement.currentTime);
  }, [videoPlayerContext]);

  const showIncompleteVideoModal = useCallback(() => {
    if (!currentLesson?.lesson_id) return;
    saveCurrentLessonVideoProgress(currentLesson.lesson_id);
    openValidationModal({
      title: t("modals.incompleteVideo.title"),
      message: t("modals.incompleteVideo.message"),
      type: "video",
      lessonId: currentLesson.lesson_id,
      redirectTab: "video",
    });
    scrollToTop();
  }, [currentLesson, openValidationModal, saveCurrentLessonVideoProgress, t]);

  const openLesson = useCallback((lesson: LearnLesson, options: OpenLessonOptions = {}) => {
    if (currentLesson?.lesson_id && currentLesson.lesson_id !== lesson.lesson_id) {
      saveCurrentLessonVideoProgress(currentLesson.lesson_id);
    }

    videoPlayerContext?.pauseAllVideos?.();
    setCurrentLesson(lesson);
    setActiveTab(options.tab ?? "video");
    scrollToTop();

    if (options.trackOpen !== false) {
      trackUserAction("lesson_opened", {
        lessonId: lesson.lesson_id,
        lessonTitle: lesson.lesson_title,
      });
    }
  }, [
    currentLesson?.lesson_id,
    saveCurrentLessonVideoProgress,
    setActiveTab,
    setCurrentLesson,
    trackUserAction,
    videoPlayerContext,
  ]);

  const openLessonById = useCallback((lessonId: string, options: OpenLessonOptions = {}) => {
    const lessonItem = findOrderedLessonById(orderedLessons, lessonId);
    if (!lessonItem) return false;

    openLesson(lessonItem.lesson, options);
    return true;
  }, [openLesson, orderedLessons]);

  return {
    cancelPendingValidation,
    getNextLesson: () => getNextOrderedLesson(orderedLessons, currentLesson?.lesson_id),
    getPreviousLesson: () => getPreviousOrderedLesson(orderedLessons, currentLesson?.lesson_id),
    openLesson,
    openLessonById,
    saveCurrentLessonVideoProgress,
    showIncompleteVideoModal,
  };
}
