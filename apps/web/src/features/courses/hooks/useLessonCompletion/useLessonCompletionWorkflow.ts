import { useCallback } from "react";
import { isAbortError, isNetworkError, warnInDevelopment } from "./error-utils";
import { setLessonCompletionState } from "./lesson-state";
import { getUnknownErrorMessage, parseLessonProgressApiResponse } from "./parsers";
import { handleProgressFailure } from "./progress-failure";
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
      // El POST es la unica fuente autoritativa: valida quizzes y actividades con
      // las mismas filas que usa para completar la leccion. Antes se lanzaba en
      // paralelo un GET de estado y, si ese GET veia un snapshot anterior, la UI
      // mostraba 0/1 aunque este POST ya hubiera completado correctamente la leccion.
      const saveResponse = await saveLessonProgress({
        slug,
        lessonId,
        organizationId,
        signal,
      });

      if (signal?.aborted) return true;

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
