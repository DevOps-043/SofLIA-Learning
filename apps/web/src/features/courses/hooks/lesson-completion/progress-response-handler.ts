import type { Dispatch, SetStateAction } from "react";

import {
  buildCompletionDetailsText,
  parseLessonProgressApiResponse,
} from "./response-parsers";
import {
  rollbackLessonWithProgress,
  setLessonCompletionState,
} from "./lesson-completion-state";
import type { Lesson, Module, OpenValidationModal } from "./types";

type ProgressResponseParams = {
  currentLesson: Lesson | null;
  lessonId: string;
  openValidationModal: OpenValidationModal;
  response: Response;
  setCourseProgress: Dispatch<SetStateAction<number>>;
  setCurrentLesson: Dispatch<SetStateAction<Lesson | null>>;
  setModules: Dispatch<SetStateAction<Module[]>>;
};

export async function handleProgressResponse(params: ProgressResponseParams) {
  const responseData = await readProgressResponse(params.response);

  if (!params.response.ok) {
    if (responseData.code === "PREVIOUS_LESSON_NOT_COMPLETED") {
      rollbackLessonWithProgress(params, params.setCourseProgress);
      return false;
    }

    if (isRequiredActivityBlock(responseData.code)) {
      setLessonCompletionState(params, false);
      params.openValidationModal({
        title: "Hace falta realizar actividad",
        message:
          responseData.details?.message ||
          responseData.error ||
          "Debes completar todas las actividades obligatorias para continuar.",
        details: buildCompletionDetailsText(responseData.details),
        type: "activity",
        lessonId: params.lessonId,
        redirectTab: "activities",
      });
      return false;
    }

    if (responseData.code || responseData.error) {
      params.openValidationModal({
        title: "No se puede completar",
        message:
          responseData.details?.message ||
          responseData.error ||
          "No se puede completar la lección en este momento.",
        type: "activity",
        lessonId: params.lessonId,
        redirectTab: "activities",
      });
      return false;
    }

    warnProgressResponse(params.response);
    return true;
  }

  if (responseData.progress?.overall_progress !== undefined) {
    params.setCourseProgress(Math.round(responseData.progress.overall_progress));
  }

  return true;
}

async function readProgressResponse(response: Response) {
  try {
    return parseLessonProgressApiResponse(await response.json());
  } catch {
    if (response.ok && process.env.NODE_ENV === "development") {
      console.warn("Respuesta no es JSON válido - Status:", response.status);
    }
    return {};
  }
}

function isRequiredActivityBlock(code?: string) {
  return code === "REQUIRED_QUIZ_NOT_PASSED" || code === "REQUIRED_ACTIVITY_NOT_COMPLETED";
}

function warnProgressResponse(response: Response) {
  if (response.status === 404 || response.status === 401) return;
  if (process.env.NODE_ENV === "development") {
    console.warn("Error guardando progreso de lección:", response.status, response.statusText);
  }
}
