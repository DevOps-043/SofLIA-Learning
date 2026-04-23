"use client";

import { useCallback } from "react";

import type { LearnLesson } from "../../components/learn/types";
import { saveLessonVideoProgress, scrollToTop } from "./navigation-dom.utils";
import type {
  OpenLessonOptions,
  OpenValidationModal,
  PauseAllVideosContext,
  TrackUserAction,
  UseLessonNavigationParams,
} from "./types";

type UseLessonOpenerParams = Pick<
  UseLessonNavigationParams,
  "currentLesson" | "setActiveTab" | "setCurrentLesson"
> & {
  openValidationModal: OpenValidationModal;
  trackUserAction: TrackUserAction;
  videoPlayerContext?: PauseAllVideosContext;
};

export function useLessonOpener({
  currentLesson,
  openValidationModal,
  setActiveTab,
  setCurrentLesson,
  trackUserAction,
  videoPlayerContext,
}: UseLessonOpenerParams) {
  const saveCurrentLessonVideoProgress = useCallback(
    (lessonId?: string | null) => saveLessonVideoProgress(lessonId, videoPlayerContext),
    [videoPlayerContext]
  );

  const showIncompleteVideoModal = useCallback(() => {
    if (!currentLesson?.lesson_id) return;

    saveCurrentLessonVideoProgress(currentLesson.lesson_id);
    openValidationModal({
      title: "Finaliza el video para continuar",
      message:
        "Por favor, finaliza el video antes de continuar con las actividades o cambiar de lección.",
      type: "video",
      lessonId: currentLesson.lesson_id,
      redirectTab: "video",
    });
    scrollToTop();
  }, [currentLesson, openValidationModal, saveCurrentLessonVideoProgress]);

  const openLesson = useCallback(
    (lesson: LearnLesson, options: OpenLessonOptions = {}) => {
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
    },
    [
      currentLesson?.lesson_id,
      saveCurrentLessonVideoProgress,
      setActiveTab,
      setCurrentLesson,
      trackUserAction,
      videoPlayerContext,
    ]
  );

  return { openLesson, saveCurrentLessonVideoProgress, showIncompleteVideoModal };
}
