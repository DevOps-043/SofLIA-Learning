"use client";

import { useCallback } from "react";
import type { LearnLesson } from "../../components/learn/types";
import { scrollToTop } from "./lesson-navigation.dom";
import type { OpenValidationModal } from "./lesson-navigation.types";

interface UseIncompleteVideoModalParams {
  currentLesson: LearnLesson | null;
  openValidationModal: OpenValidationModal;
  saveCurrentLessonVideoProgress: (lessonId?: string | null) => void;
  t: (key: string) => string;
}

export function useIncompleteVideoModal({
  currentLesson,
  openValidationModal,
  saveCurrentLessonVideoProgress,
  t,
}: UseIncompleteVideoModalParams) {
  return useCallback(() => {
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
}
