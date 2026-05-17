import { buildCompletionDetailsText } from "./details-text";
import { rollbackLessonCompletion } from "./lesson-state";
import type {
  LessonProgressApiResponse,
  LearnTranslate,
  UseLessonCompletionParams,
  ValidationModalState,
} from "./types";

interface HandleProgressFailureParams extends UseLessonCompletionParams {
  lessonId: string;
  response: Response;
  responseData: LessonProgressApiResponse;
  t: LearnTranslate;
  openValidationModal: (modal: Omit<ValidationModalState, "isOpen">) => void;
}

export function handleProgressFailure({
  lessonId,
  response,
  responseData,
  t,
  openValidationModal,
  ...stateParams
}: HandleProgressFailureParams): boolean {
  if (responseData.code === "PREVIOUS_LESSON_NOT_COMPLETED") {
    rollbackLessonCompletion({ ...stateParams, lessonId }, true);
    return false;
  }

  if (
    responseData.code === "REQUIRED_QUIZ_NOT_PASSED" ||
    responseData.code === "REQUIRED_ACTIVITY_NOT_COMPLETED"
  ) {
    rollbackLessonCompletion({ ...stateParams, lessonId });
    openValidationModal({
      title: t("modals.activityRequired.title"),
      message:
        responseData.details?.message ||
        responseData.error ||
        t("modals.activityRequired.messageActivities"),
      details: buildCompletionDetailsText(responseData.details, t),
      type: "activity",
      lessonId,
      redirectTab: "activities",
    });
    return false;
  }

  if (responseData.code || responseData.error) {
    openValidationModal({
      title: t("modals.cannotCompleteLesson.title"),
      message:
        responseData.details?.message ||
        responseData.error ||
        t("modals.cannotCompleteLesson.message"),
      type: "activity",
      lessonId,
      redirectTab: "activities",
    });
    return false;
  }

  if (
    response.status !== 404 &&
    response.status !== 401 &&
    process.env.NODE_ENV === "development"
  ) {
    console.warn(
      "Error guardando progreso de lección:",
      response.status,
      response.statusText
    );
  }
  return true;
}
