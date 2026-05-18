import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { LearnLesson } from "../../components/learn/types";
import type { PendingValidationRef } from "./types";
import { isAbortError } from "./browser";

interface CompletePreviousLessonParams {
  logMessage: string;
  markLessonAsCompleted: (lessonId: string, signal?: AbortSignal) => Promise<boolean>;
  onRejected: () => void;
  pendingValidationRef: PendingValidationRef;
  previousLesson: LearnLesson;
}

export async function completePreviousLesson({
  logMessage,
  markLessonAsCompleted,
  onRejected,
  pendingValidationRef,
  previousLesson,
}: CompletePreviousLessonParams): Promise<boolean> {
  const abortController = new AbortController();
  pendingValidationRef.current = abortController;

  try {
    const canComplete = await markLessonAsCompleted(
      previousLesson.lesson_id,
      abortController.signal
    );

    if (pendingValidationRef.current !== abortController) return false;

    pendingValidationRef.current = null;

    if (!canComplete) {
      onRejected();
      return false;
    }

    return true;
  } catch (error: unknown) {
    if (pendingValidationRef.current === abortController) {
      pendingValidationRef.current = null;
    }

    if (!isAbortError(error) && process.env.NODE_ENV === "development") {
      techDebtLogger.warn(logMessage, error);
    }

    return false;
  }
}
