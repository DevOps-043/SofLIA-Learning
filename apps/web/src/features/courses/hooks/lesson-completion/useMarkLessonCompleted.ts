"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  isAbortLikeError,
  isIgnoredNetworkError,
  getUnknownErrorMessage,
} from "./error.utils";
import { setLessonCompletionState } from "./lesson-completion-state";
import { handleProgressResponse } from "./progress-response-handler";
import { buildCompletionDetailsText } from "./response-parsers";
import { saveLessonProgress } from "./save-progress.service";
import type { CheckQuizStatus, Lesson, Module, OpenValidationModal } from "./types";

type UseMarkLessonCompletedParams = {
  slug: string;
  organizationId: string | null;
  currentLesson: Lesson | null;
  canCompleteLesson: (lessonId: string) => boolean;
  checkQuizStatus: CheckQuizStatus;
  openValidationModal: OpenValidationModal;
  setModules: Dispatch<SetStateAction<Module[]>>;
  setCurrentLesson: Dispatch<SetStateAction<Lesson | null>>;
  setCourseProgress: Dispatch<SetStateAction<number>>;
};

export function useMarkLessonCompleted(params: UseMarkLessonCompletedParams) {
  return useCallback(
    async (lessonId: string, signal?: AbortSignal): Promise<boolean> => {
      if (!params.canCompleteLesson(lessonId)) return false;

      setLessonCompletionState({ ...params, lessonId }, true);

      try {
        const [quizStatus, saveResponse] = await Promise.all([
          params.checkQuizStatus(lessonId, signal),
          saveLessonProgress(params.slug, lessonId, params.organizationId, signal),
        ]);

        if (signal?.aborted) return true;
        if (!quizStatus.canComplete) {
          setLessonCompletionState({ ...params, lessonId }, false);
          // TODO(i18n): Replace these hardcoded strings with t() keys from the 'learn' namespace.
          // title → 'learn.lessonCompletion.quizGate.title'
          // message → 'learn.lessonCompletion.quizGate.message'
          // redirectTab → use a typed LessonTab constant instead of a raw string
          params.openValidationModal({
            title: "Hace falta realizar actividad",
            message:
              quizStatus.details?.message ||
              quizStatus.error ||
              "Debes completar y aprobar todos los quizzes obligatorios para continuar.",
            details: buildCompletionDetailsText(quizStatus.details),
            type: "activity",
            lessonId,
            redirectTab: "activities",
          });
          return false;
        }

        return handleProgressResponse({ ...params, lessonId, response: saveResponse });
      } catch (error: unknown) {
        if (isAbortLikeError(error, signal)) return true;
        if (isIgnoredNetworkError(error)) {
          warnIgnoredCompletionError("Error de red marcando lección como completada (ignorado):", error);
          return true;
        }

        warnIgnoredCompletionError("Error al guardar progreso en BD (ignorado):", error);
        return true;
      }
    },
    [params]
  );
}

function warnIgnoredCompletionError(label: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.warn(label, getUnknownErrorMessage(error) ?? error);
  }
}
