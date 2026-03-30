"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { LearnLesson, LearnModule } from "../components/learn/types";

type Lesson = LearnLesson;
type Module = LearnModule;

interface ValidationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  type: "activity" | "video" | "quiz";
  lessonId?: string;
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

export function useLessonCompletion({
  slug,
  currentLesson,
  modules,
  setModules,
  setCurrentLesson,
  setCourseProgress,
  canCompleteLesson,
}: UseLessonCompletionParams) {
  const [isCourseCompletedModalOpen, setIsCourseCompletedModalOpen] = useState(false);
  const [isCannotCompleteModalOpen, setIsCannotCompleteModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [validationModal, setValidationModal] = useState<ValidationModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "activity",
    lessonId: undefined,
  });

  const checkQuizStatus = async (
    lessonId: string,
    signal?: AbortSignal
  ): Promise<{ canComplete: boolean; error?: string; details?: any }> => {
    try {
      const response = await fetch(
        `/api/courses/${slug}/lessons/${lessonId}/quiz/status`,
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

      const data = await response.json();

      if (!data.hasRequiredQuizzes) {
        return { canComplete: true };
      }

      if (data.allQuizzesPassed) {
        return { canComplete: true };
      }

      return {
        canComplete: false,
        error: "Hace falta realizar actividad",
        details: {
          totalRequired: data.totalRequiredQuizzes,
          passed: data.passedQuizzes,
          message: `Debes completar y aprobar todos los quizzes obligatorios (${data.passedQuizzes}/${data.totalRequiredQuizzes} completados)`,
        },
      };
    } catch (error: any) {
      if (error?.name === "AbortError" || signal?.aborted) {
        return { canComplete: true };
      }

      if (
        error?.message?.includes("Failed to fetch") ||
        error?.message?.includes("NetworkError")
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Error de red verificando estado de quizzes (ignorado):",
            error.message
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
          signal,
        }).catch((fetchError: any) => {
          if (fetchError?.name === "AbortError" || signal?.aborted) {
            return new Response(null, { status: 200, statusText: "Cancelled" });
          }
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "Error de red guardando progreso (ignorado):",
              fetchError.message
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

        setValidationModal({
          isOpen: true,
          title: "Hace falta realizar actividad",
          message:
            quizStatus.details?.message ||
            quizStatus.error ||
            "Debes completar y aprobar todos los quizzes obligatorios para continuar.",
          details: quizStatus.details
            ? `Completados: ${quizStatus.details.passed} de ${quizStatus.details.totalRequired}`
            : undefined,
          type: "activity",
          lessonId: lessonId,
        });
        return false;
      }

      const response = saveResponse;

      if (!response.ok) {
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

      let responseData: any;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Respuesta no es JSON válido - Status:", response.status);
        }
        return true;
      }

      if (!response.ok) {
        if (responseData?.code === "PREVIOUS_LESSON_NOT_COMPLETED") {
          setModules((prevModules) => {
            const updatedModules = prevModules.map((module) => ({
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.lesson_id === lessonId
                  ? { ...lesson, is_completed: false }
                  : lesson
              ),
            }));

            const allLessons = updatedModules.flatMap((m: Module) => m.lessons);
            const completedLessons = allLessons.filter((l: Lesson) => l.is_completed);
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

        if (responseData?.code === "REQUIRED_QUIZ_NOT_PASSED") {
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

          setValidationModal({
            isOpen: true,
            title: "Hace falta realizar actividad",
            message:
              responseData?.details?.message ||
              responseData?.error ||
              "Debes completar y aprobar todos los quizzes obligatorios para continuar.",
            details: responseData?.details
              ? `Completados: ${responseData.details.passed} de ${responseData.details.totalRequired}`
              : undefined,
            type: "activity",
            lessonId: lessonId,
          });
          return false;
        }

        if (responseData?.code) {
          setValidationModal({
            isOpen: true,
            title: "No se puede completar",
            message:
              responseData?.details?.message ||
              responseData?.error ||
              "No se puede completar la lección en este momento.",
            type: "activity",
            lessonId: lessonId,
          });
          return false;
        }

        return true;
      }

      if (responseData?.progress?.overall_progress !== undefined) {
        setCourseProgress(Math.round(responseData.progress.overall_progress));
      }

      return true;
    } catch (error: any) {
      if (error?.name === "AbortError" || signal?.aborted) {
        return true;
      }

      if (
        error?.message?.includes("Failed to fetch") ||
        error?.message?.includes("NetworkError")
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Error de red marcando lección como completada (ignorado):",
            error.message
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
    validationModal,
    setValidationModal,
    isCourseCompletedModalOpen,
    setIsCourseCompletedModalOpen,
    isCannotCompleteModalOpen,
    setIsCannotCompleteModalOpen,
    isRatingModalOpen,
    setIsRatingModalOpen,
    hasUserRated,
    setHasUserRated,
  };
}
