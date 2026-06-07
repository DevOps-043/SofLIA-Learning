import { useCallback } from "react";
import { buildCompletionDetailsText } from "./details-text";
import { isAbortError, isNetworkError, warnInDevelopment } from "./error-utils";
import { rollbackLessonCompletion, setLessonCompletionState } from "./lesson-state";
import { getUnknownErrorMessage, parseLessonProgressApiResponse } from "./parsers";
import { handleProgressFailure } from "./progress-failure";
import { checkLessonQuizStatus } from "./quiz-status";
import { saveLessonProgress } from "./save-progress";
import type { LearnTranslate, LessonProgressApiResponse, UseLessonCompletionParams, ValidationModalState } from "./types";

interface UseLessonCompletionWorkflowParams extends UseLessonCompletionParams {
  organizationId?: string | null;
  t: LearnTranslate;
  openValidationModal: (modal: Omit<ValidationModalState, "isOpen">) => void;
}

export function useLessonCompletionWorkflow(params: UseLessonCompletionWorkflowParams) {
  const { slug, organizationId, canCompleteLesson, t, openValidationModal } = params;

  return useCallback(async (lessonId: string, signal?: AbortSignal): Promise<boolean> => {
    if (!canCompleteLesson(lessonId)) return false;

    setLessonCompletionState({ ...params, lessonId }, true);

    try {
      const [quizStatus, saveResponse] = await Promise.all([
        checkLessonQuizStatus({ slug, lessonId, organizationId, signal, t }),
        saveLessonProgress({ slug, lessonId, organizationId, signal }),
      ]);

      if (signal?.aborted) return true;

      if (!quizStatus.canComplete) {
        rollbackLessonCompletion({ ...params, lessonId });
        openValidationModal({
          title: t("modals.activityRequired.title"),
          message:
            quizStatus.details?.message ||
            quizStatus.error ||
            t("modals.activityRequired.messageFallback"),
          details: buildCompletionDetailsText(quizStatus.details, t),
          type: "activity",
          lessonId,
          redirectTab: "activities",
        });
        return false;
      }

      let responseData: LessonProgressApiResponse = {};
      try {
        responseData = parseLessonProgressApiResponse(await saveResponse.json());
      } catch {
        warnInDevelopment("Respuesta no es JSON válido - Status:", saveResponse.status);
      }

      if (!saveResponse.ok) {
        return handleProgressFailure({
          ...params,
          lessonId,
          response: saveResponse,
          responseData,
          t,
          openValidationModal,
        });
      }

      if (responseData.progress?.overall_progress !== undefined) {
        params.setCourseProgress(Math.round(responseData.progress.overall_progress));
      }
      return true;
    } catch (error: unknown) {
      if (isAbortError(error, signal)) return true;
      if (isNetworkError(error)) {
        warnInDevelopment(
          "Error de red marcando lección como completada (ignorado):",
          getUnknownErrorMessage(error)
        );
        return true;
      }
      warnInDevelopment("Error al guardar progreso en BD (ignorado):", error);
      return true;
    }
  }, [canCompleteLesson, openValidationModal, organizationId, params, slug, t]);
}
