import { logger as techDebtLogger } from '@/lib/utils/logger'
import { isAbortError, isNetworkError, warnInDevelopment } from "./error-utils";
import { getUnknownErrorMessage, parseQuizStatusApiResponse } from "./parsers";
import type { LearnTranslate, QuizStatusResult } from "./types";

interface CheckQuizStatusParams {
  slug: string;
  lessonId: string;
  organizationId?: string | null;
  signal?: AbortSignal;
  t: LearnTranslate;
}

export async function checkLessonQuizStatus({
  slug,
  lessonId,
  organizationId,
  signal,
  t,
}: CheckQuizStatusParams): Promise<QuizStatusResult> {
  try {
    const query = organizationId ? `?orgId=${encodeURIComponent(organizationId)}` : "";
    const response = await fetch(
      `/api/courses/${slug}/lessons/${lessonId}/quiz/status${query}`,
      { signal }
    );

    if (signal?.aborted) {
      return { canComplete: true };
    }

    if (!response.ok) {
      if (response.status !== 404 && response.status !== 401) {
        warnInDevelopment(
          "Error verificando estado de quizzes:",
          response.status,
          response.statusText
        );
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
          total: data.totalRequiredQuizzes ?? 0,
        }),
      },
    };
  } catch (error: unknown) {
    if (isAbortError(error, signal)) {
      return { canComplete: true };
    }

    if (isNetworkError(error)) {
      warnInDevelopment(
        "Error de red verificando estado de quizzes (ignorado):",
        getUnknownErrorMessage(error)
      );
      return { canComplete: true };
    }

    if (process.env.NODE_ENV === "development") {
      techDebtLogger.error("Error verificando estado de quizzes:", error);
    }
    return { canComplete: true };
  }
}
