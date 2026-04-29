"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import type {
  LearnActivityMap,
  LearnLesson,
  LearnMaterialMap,
  LearnOrderedLesson,
  LearnTab,
} from "../components/learn/types";

import {
  findOrderedLessonById,
  findOrderedLessonIndex,
  getPendingRequiredActivities,
  isLessonVideoCompleted,
  getNextOrderedLesson,
  getPreviousOrderedLesson,
} from "./lessonNavigation.utils";

type TrackUserAction = (
  action: string,
  metadata?: Record<string, unknown>
) => void;

type PauseAllVideosContext = {
  pauseAllVideos?: () => void;
  saveVideoProgress?: (lessonId: string, time: number) => void;
} | null;

type OpenValidationModal = (modal: {
  title: string;
  message: string;
  details?: string;
  type: "activity" | "video" | "quiz";
  lessonId?: string;
  redirectTab?: LearnTab;
}) => void;

type OpenLessonOptions = {
  tab?: LearnTab;
  trackOpen?: boolean;
};

type UseLessonNavigationParams = {
  orderedLessons: LearnOrderedLesson[];
  modules: Array<{
    module_id: string;
    lessons: LearnLesson[];
  }>;
  currentLesson: LearnLesson | null;
  lessonsActivities: LearnActivityMap;
  lessonsMaterials: LearnMaterialMap;
  setCurrentLesson: Dispatch<SetStateAction<LearnLesson | null>>;
  setActiveTab: Dispatch<SetStateAction<LearnTab>>;
  markLessonAsCompleted: (
    lessonId: string,
    signal?: AbortSignal
  ) => Promise<boolean>;
  loadLessonActivitiesAndMaterials: (
    lessonId: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  openValidationModal: OpenValidationModal;
  trackUserAction: TrackUserAction;
  videoPlayerContext?: PauseAllVideosContext;
};

function scrollToTop() {
  if (typeof window === "undefined") {
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function useLessonNavigation({
  orderedLessons,
  modules,
  currentLesson,
  lessonsActivities,
  lessonsMaterials,
  setCurrentLesson,
  setActiveTab,
  markLessonAsCompleted,
  loadLessonActivitiesAndMaterials,
  openValidationModal,
  trackUserAction,
  videoPlayerContext,
}: UseLessonNavigationParams) {
  const { t } = useTranslation("learn");
  const pendingValidationRef = useRef<AbortController | null>(null);

  const cancelPendingValidation = useCallback(() => {
    pendingValidationRef.current?.abort();
    pendingValidationRef.current = null;
  }, []);

  const saveCurrentLessonVideoProgress = useCallback(
    (lessonId?: string | null) => {
      if (!lessonId) {
        return;
      }

      const currentVideoElement = document.querySelector(
        ".aspect-video video"
      ) as HTMLVideoElement | null;

      if (!currentVideoElement) {
        return;
      }

      videoPlayerContext?.saveVideoProgress?.(
        lessonId,
        currentVideoElement.currentTime
      );
    },
    [videoPlayerContext]
  );

  const showIncompleteVideoModal = useCallback(() => {
    if (!currentLesson?.lesson_id) {
      return;
    }

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

  const openLesson = useCallback(
    (lesson: LearnLesson, options: OpenLessonOptions = {}) => {
      if (
        currentLesson?.lesson_id &&
        currentLesson.lesson_id !== lesson.lesson_id
      ) {
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

  const openLessonById = useCallback(
    (lessonId: string, options: OpenLessonOptions = {}) => {
      const lessonItem = findOrderedLessonById(orderedLessons, lessonId);

      if (!lessonItem) {
        return false;
      }

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

  const handleLessonChange = useCallback(
    async (lesson: LearnLesson) => {
      if (currentLesson?.lesson_id === lesson.lesson_id) {
        return;
      }

      cancelPendingValidation();

      if (!currentLesson) {
        openLesson(lesson);
        return;
      }

      const currentIndex = findOrderedLessonIndex(
        orderedLessons,
        currentLesson.lesson_id
      );
      const selectedIndex = findOrderedLessonIndex(
        orderedLessons,
        lesson.lesson_id
      );

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

      const pendingRequired = getPendingRequiredActivities(
        lessonsActivities[currentLesson.lesson_id]
      );

      if (pendingRequired.length > 0) {
        const pendingTitles = pendingRequired
          .map((activity) => activity.activity_title)
          .join(", ");

        trackUserAction("attempted_lesson_change_without_completion", {
          currentLessonId: currentLesson.lesson_id,
          currentLessonTitle: currentLesson.lesson_title,
          targetLessonId: lesson.lesson_id,
          targetLessonTitle: lesson.lesson_title,
          pendingActivities: pendingTitles,
          pendingCount: pendingRequired.length,
        });
      } else {
        trackUserAction("lesson_change", {
          from: currentLesson.lesson_title,
          to: lesson.lesson_title,
        });
      }

      if (pendingRequired.length > 0) {
        saveCurrentLessonVideoProgress(currentLesson.lesson_id);
        setActiveTab("activities");
        scrollToTop();
        return;
      }

      const previousLesson = currentLesson;

      openLesson(lesson);

      const abortController = new AbortController();
      pendingValidationRef.current = abortController;

      try {
        const canComplete = await markLessonAsCompleted(
          previousLesson.lesson_id,
          abortController.signal
        );

        if (pendingValidationRef.current !== abortController) {
          return;
        }

        pendingValidationRef.current = null;

        if (!canComplete) {
          openLesson(previousLesson, { trackOpen: false });
          trackUserAction("attempted_locked_lesson", {
            targetLessonId: lesson.lesson_id,
            targetLessonTitle: lesson.lesson_title,
            reason: "previous_lesson_not_completed",
          });
        }
      } catch (error: unknown) {
        if (pendingValidationRef.current === abortController) {
          pendingValidationRef.current = null;
        }

        if (
          (error as { name?: string })?.name !== "AbortError" &&
          process.env.NODE_ENV === "development"
        ) {
          console.warn(
            "Error en validacion de cambio de leccion (ignorado):",
            error
          );
        }
      }
    },
    [
      cancelPendingValidation,
      currentLesson,
      lessonsActivities,
      markLessonAsCompleted,
      openLesson,
      orderedLessons,
      saveCurrentLessonVideoProgress,
      showIncompleteVideoModal,
      trackUserAction,
    ]
  );

  const navigateToPreviousLesson = useCallback(() => {
    cancelPendingValidation();

    const previousLesson = getPreviousLesson();

    if (previousLesson) {
      openLesson(previousLesson);
    }
  }, [cancelPendingValidation, getPreviousLesson, openLesson]);

  const navigateToNextLesson = useCallback(async () => {
    cancelPendingValidation();

    const nextLesson = getNextLesson();

    if (!nextLesson || !currentLesson) {
      return;
    }

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

    const pendingRequired = getPendingRequiredActivities(
      lessonsActivities[currentLesson.lesson_id]
    );

    if (pendingRequired.length > 0) {
      trackUserAction("redirected_to_pending_activities", {
        currentLessonId: currentLesson.lesson_id,
        currentLessonTitle: currentLesson.lesson_title,
        pendingActivities: pendingRequired.map(
          (activity) => activity.activity_title
        ),
        pendingCount: pendingRequired.length,
      });
      saveCurrentLessonVideoProgress(currentLesson.lesson_id);
      setActiveTab("activities");
      scrollToTop();
      return;
    }

    const canComplete = await markLessonAsCompleted(currentLesson.lesson_id);

    if (canComplete) {
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

  useEffect(() => {
    if (!currentLesson || modules.length === 0) {
      return;
    }

    const currentModule = modules.find((module) =>
      module.lessons.some(
        (lesson) => lesson.lesson_id === currentLesson.lesson_id
      )
    );

    if (!currentModule) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const lessonsToPreload = currentModule.lessons
        .filter((lesson) => lesson.lesson_id !== currentLesson.lesson_id)
        .filter(
          (lesson) =>
            lessonsActivities[lesson.lesson_id] === undefined ||
            lessonsMaterials[lesson.lesson_id] === undefined
        )
        .slice(0, 3);

      lessonsToPreload.forEach((lesson) => {
        loadLessonActivitiesAndMaterials(lesson.lesson_id).catch(() => {
          return;
        });
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentLesson,
    lessonsActivities,
    lessonsMaterials,
    loadLessonActivitiesAndMaterials,
    modules,
  ]);

  useEffect(() => cancelPendingValidation, [cancelPendingValidation]);

  return {
    getPreviousLesson,
    getNextLesson,
    handleLessonChange,
    navigateToPreviousLesson,
    navigateToNextLesson,
    openLessonById,
  };
}
