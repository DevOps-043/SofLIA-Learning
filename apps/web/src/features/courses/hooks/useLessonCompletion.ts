"use client";

import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type {
  LearnLesson,
  LearnModule,
  LearnTab,
} from "../components/learn/types";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";

type Lesson = LearnLesson;
type Module = LearnModule;

interface ValidationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  type: "activity" | "video" | "quiz";
  lessonId?: string;
  redirectTab?: LearnTab;
}

interface LessonCompletionDetails {
  totalRequired: number;
  passed: number;
  message: string;
}

interface QuizStatusResult {
  canComplete: boolean;
  error?: string;
  details?: LessonCompletionDetails;
}

interface QuizStatusApiResponse {
  hasRequiredQuizzes?: boolean;
  allQuizzesPassed?: boolean;
  totalRequiredQuizzes?: number;
  passedQuizzes?: number;
}

interface LessonProgressApiResponse {
  code?: string;
  error?: string;
  details?: Partial<LessonCompletionDetails>;
  progress?: {
    overall_progress?: number;
  };
}

interface UseLessonCompletionParams {
  slug: string;
  currentLesson: Lesson | null;
  modules: Module[];
  setModules: Dispatch<SetStateAction<Module[]>>;
  setCurrentLesson: Dispatch<SetStateAction<Lesson | null>>;
  setCourseProgress: Dispatch<SetStateAction<number>>;
  canCompleteLesson: (lessonId: string) => boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getUnknownErrorName(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  return typeof error.name === "string" ? error.name : undefined;
}

function getUnknownErrorMessage(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  return typeof error.message === "string" ? error.message : undefined;
}

function parseQuizStatusApiResponse(value: unknown): QuizStatusApiResponse {
  if (!isRecord(value)) {
    return {};
  }

  return {
    hasRequiredQuizzes:
      typeof value.hasRequiredQuizzes === "boolean" ? value.hasRequiredQuizzes : undefined,
    allQuizzesPassed:
      typeof value.allQuizzesPassed === "boolean" ? value.allQuizzesPassed : undefined,
    totalRequiredQuizzes:
      typeof value.totalRequiredQuizzes === "number" ? value.totalRequiredQuizzes : undefined,
    passedQuizzes: typeof value.passedQuizzes === "number" ? value.passedQuizzes : undefined,
  };
}

function parseLessonCompletionDetails(value: unknown): Partial<LessonCompletionDetails> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    totalRequired: typeof value.totalRequired === "number" ? value.totalRequired : undefined,
    passed: typeof value.passed === "number" ? value.passed : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
  };
}

function parseLessonProgressApiResponse(value: unknown): LessonProgressApiResponse {
  if (!isRecord(value)) {
    return {};
  }

  const progressValue = isRecord(value.progress) ? value.progress : undefined;

  return {
    code: typeof value.code === "string" ? value.code : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
    details: parseLessonCompletionDetails(value.details),
    progress: progressValue
      ? {
          overall_progress:
            typeof progressValue.overall_progress === "number"
              ? progressValue.overall_progress
              : undefined,
        }
      : undefined,
  };
}

function buildCompletionDetailsText(
  details: Partial<LessonCompletionDetails> | undefined,
  t: (key: string, options?: any) => string
): string | undefined {
  if (
    typeof details?.passed !== "number" ||
    typeof details.totalRequired !== "number"
  ) {
    return undefined;
  }

  return t("activities.completedCount", {
    passed: details.passed,
    total: details.totalRequired,
    defaultValue: `Completados: ${details.passed} de ${details.totalRequired}`
  });
}

export function useLessonCompletion({
  slug,
  currentLesson,
  modules,
  setModules,
  setCurrentLesson,
  setCourseProgress,
  canCompleteLesson,
}: UseLessonCompletionParams) {
  const { t } = useTranslation("learn");
  const organizationId = useCurrentOrganizationId();
  const [validationModal, setValidationModal] = useState<ValidationModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "activity",
    lessonId: undefined,
    redirectTab: undefined,
  });

  const openValidationModal = useCallback(
    (modal: Omit<ValidationModalState, "isOpen">) => {
      setValidationModal({
        ...modal,
        isOpen: true,
      });
    },
    []
  );

  const checkQuizStatus = async (
    lessonId: string,
    signal?: AbortSignal
  ): Promise<QuizStatusResult> => {
    try {
      const response = await fetch(
        `/api/courses/${slug}/lessons/${lessonId}/quiz/status${
          organizationId ? `?orgId=${encodeURIComponent(organizationId)}` : ""
        }`,
        { signal }
      );

      if (signal?.aborted) {
        return { canComplete: true };
      }

      if (!response.ok) {
        if (response.status !== 404 && response.status !== 401) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "Error verificando estado de quizzes:",
              response.status,
              response.statusText
            );
          }
        }
        return { canComplete: true };
      }

      const data = parseQuizStatusApiResponse(await response.json());

      if (!data.hasRequiredQuizzes || data.allQuizzesPassed) {
        return { canComplete: true };
      }

      return {
        canComplete: false,
        error: t("modals.activityRequired.title"),
        details: {
          totalRequired: data.totalRequiredQuizzes ?? 0,
          passed: data.passedQuizzes ?? 0,
          message: t("modals.activityRequired.messageQuiz", {
            passed: data.passedQuizzes ?? 0,
            total: data.totalRequiredQuizzes ?? 0
          }),
        },
      };
    } catch (error: unknown) {
      if (getUnknownErrorName(error) === "AbortError" || signal?.aborted) {
        return { canComplete: true };
      }

      const errorMessage = getUnknownErrorMessage(error) ?? "";
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Error de red verificando estado de quizzes (ignorado):",
            errorMessage
          );
        }
        return { canComplete: true };
      }

      if (process.env.NODE_ENV === "development") {
        console.error("Error verificando estado de quizzes:", error);
      }
      return { canComplete: true };
    }
  };

  const markLessonAsCompleted = async (
    lessonId: string,
    signal?: AbortSignal
  ): Promise<boolean> => {
    if (!canCompleteLesson(lessonId)) {
      return false;
    }

    setModules((prevModules) =>
      prevModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) =>
          lesson.lesson_id === lessonId
            ? { ...lesson, is_completed: true }
            : lesson
        ),
      }))
    );

    if (currentLesson?.lesson_id === lessonId) {
      setCurrentLesson((prev) =>
        prev ? { ...prev, is_completed: true } : null
      );
    }

    try {
      const [quizStatus, saveResponse] = await Promise.all([
        checkQuizStatus(lessonId, signal),
        fetch(`/api/courses/${slug}/lessons/${lessonId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(organizationId ? { organizationId } : {}),
          signal,
        }).catch((fetchError: unknown) => {
          if (getUnknownErrorName(fetchError) === "AbortError" || signal?.aborted) {
            return new Response(null, { status: 200, statusText: "Cancelled" });
          }
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "Error de red guardando progreso (ignorado):",
              getUnknownErrorMessage(fetchError)
            );
          }
          return new Response(null, {
            status: 200,
            statusText: "Network Error (ignored)",
          });
        }),
      ]);

      if (signal?.aborted) {
        return true;
      }

      if (!quizStatus.canComplete) {
        setModules((prevModules) =>
          prevModules.map((module) => ({
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.lesson_id === lessonId
                ? { ...lesson, is_completed: false }
                : lesson
            ),
          }))
        );

        if (currentLesson?.lesson_id === lessonId) {
          setCurrentLesson((prev) =>
            prev ? { ...prev, is_completed: false } : null
          );
        }

        openValidationModal({
          title: t("modals.activityRequired.title"),
          message:
            quizStatus.details?.message ||
            quizStatus.error ||
            t("modals.activityRequired.messageFallback"),
          details: buildCompletionDetailsText(quizStatus.details, t),
          type: "activity",
          lessonId: lessonId,
          redirectTab: "activities",
        });
        return false;
      }

      const response = saveResponse;
      let responseData: LessonProgressApiResponse = {};

      try {
        responseData = parseLessonProgressApiResponse(await response.json());
      } catch (jsonError) {
        if (response.ok && process.env.NODE_ENV === "development") {
          console.warn("Respuesta no es JSON válido - Status:", response.status);
        }
      }

      if (!response.ok) {
        if (responseData.code === "PREVIOUS_LESSON_NOT_COMPLETED") {
          setModules((prevModules) => {
            const updatedModules = prevModules.map((module) => ({
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.lesson_id === lessonId
                  ? { ...lesson, is_completed: false }
                  : lesson
              ),
            }));

            const allLessons = updatedModules.flatMap((module) => module.lessons);
            const completedLessons = allLessons.filter((lesson) => lesson.is_completed);
            const totalProgress =
              allLessons.length > 0
                ? Math.round((completedLessons.length / allLessons.length) * 100)
                : 0;

            setCourseProgress(totalProgress);
            return updatedModules;
          });

          if (currentLesson?.lesson_id === lessonId) {
            setCurrentLesson((prev) =>
              prev ? { ...prev, is_completed: false } : null
            );
          }

          return false;
        }

        if (
          responseData.code === "REQUIRED_QUIZ_NOT_PASSED" ||
          responseData.code === "REQUIRED_ACTIVITY_NOT_COMPLETED"
        ) {
          setModules((prevModules) =>
            prevModules.map((module) => ({
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.lesson_id === lessonId
                  ? { ...lesson, is_completed: false }
                  : lesson
              ),
            }))
          );

          if (currentLesson?.lesson_id === lessonId) {
            setCurrentLesson((prev) =>
              prev ? { ...prev, is_completed: false } : null
            );
          }

          openValidationModal({
            title: t("modals.activityRequired.title"),
            message:
              responseData.details?.message ||
              responseData.error ||
              t("modals.activityRequired.messageActivities"),
            details: buildCompletionDetailsText(responseData.details, t),
            type: "activity",
            lessonId: lessonId,
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
            lessonId: lessonId,
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

      if (responseData.progress?.overall_progress !== undefined) {
        setCourseProgress(Math.round(responseData.progress.overall_progress));
      }

      return true;
    } catch (error: unknown) {
      if (getUnknownErrorName(error) === "AbortError" || signal?.aborted) {
        return true;
      }

      const errorMessage = getUnknownErrorMessage(error) ?? "";
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Error de red marcando lección como completada (ignorado):",
            errorMessage
          );
        }
        return true;
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("Error al guardar progreso en BD (ignorado):", error);
      }
      return true;
    }
  };

  return {
    checkQuizStatus,
    markLessonAsCompleted,
    openValidationModal,
    validationModal,
    setValidationModal,
  };
}
