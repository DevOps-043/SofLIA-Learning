import type { MutableRefObject } from "react";

import type { LearnLesson } from "../../components/learn/types";
import type { OpenLessonOptions } from "./types";

type ChangeValidationParams = {
  markLessonAsCompleted: (lessonId: string, signal?: AbortSignal) => Promise<boolean>;
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
  pendingValidationRef: MutableRefObject<AbortController | null>;
  trackUserAction: (action: string, metadata?: Record<string, unknown>) => void;
};

export async function openLessonAndValidatePrevious(
  params: ChangeValidationParams,
  previousLesson: LearnLesson,
  nextLesson: LearnLesson
) {
  params.openLesson(nextLesson);

  const abortController = new AbortController();
  params.pendingValidationRef.current = abortController;

  try {
    const canComplete = await params.markLessonAsCompleted(
      previousLesson.lesson_id,
      abortController.signal
    );

    if (params.pendingValidationRef.current !== abortController) return;
    params.pendingValidationRef.current = null;

    if (!canComplete) {
      params.openLesson(previousLesson, { trackOpen: false });
      params.trackUserAction("attempted_locked_lesson", {
        targetLessonId: nextLesson.lesson_id,
        targetLessonTitle: nextLesson.lesson_title,
        reason: "previous_lesson_not_completed",
      });
    }
  } catch (error: unknown) {
    if (params.pendingValidationRef.current === abortController) {
      params.pendingValidationRef.current = null;
    }

    if ((error as { name?: string })?.name !== "AbortError" && process.env.NODE_ENV === "development") {
      console.warn("Error en validacion de cambio de leccion (ignorado):", error);
    }
  }
}
