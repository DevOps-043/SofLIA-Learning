import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { LearnLesson } from "../../components/learn/types";
import type { OpenLessonOptions, PendingValidationRef, TrackUserAction } from "./lesson-navigation.types";

interface RunCompletionValidationParams {
  abortController: AbortController;
  markLessonAsCompleted: (lessonId: string, signal?: AbortSignal) => Promise<boolean>;
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
  pendingValidationRef: PendingValidationRef;
  previousLesson: LearnLesson;
  targetLesson: LearnLesson;
  trackUserAction: TrackUserAction;
}

export async function runCompletionValidation({
  abortController,
  markLessonAsCompleted,
  openLesson,
  pendingValidationRef,
  previousLesson,
  targetLesson,
  trackUserAction,
}: RunCompletionValidationParams) {
  try {
    const canComplete = await markLessonAsCompleted(previousLesson.lesson_id, abortController.signal);

    if (pendingValidationRef.current !== abortController) return;

    pendingValidationRef.current = null;

    if (!canComplete) {
      openLesson(previousLesson, { trackOpen: false });
      trackUserAction("attempted_locked_lesson", {
        targetLessonId: targetLesson.lesson_id,
        targetLessonTitle: targetLesson.lesson_title,
        reason: "previous_lesson_not_completed",
      });
    }
  } catch (error: unknown) {
    if (pendingValidationRef.current === abortController) {
      pendingValidationRef.current = null;
    }

    if ((error as { name?: string })?.name !== "AbortError" && process.env.NODE_ENV === "development") {
      techDebtLogger.warn("Error en validacion de cambio de leccion (ignorado):", error);
    }
  }
}
