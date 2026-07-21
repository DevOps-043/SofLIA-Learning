import { logger as techDebtLogger } from '@/lib/utils/logger'
import type {
  QuizServerResult,
  QuizSubmitOutcome,
  SubmitQuizResultsParams,
} from "./quiz-renderer.types";

interface QuizSubmitResponseBody {
  error?: string;
  message?: string;
  details?: { retryAfter?: string } | null;
  result?: QuizServerResult;
}

/**
 * Envía las respuestas del alumno al endpoint de calificación autoritativa.
 * El body ya NO incluye la clave de respuestas (`quizData`); el servidor califica
 * contra el contenido almacenado en BD y devuelve el resultado por pregunta.
 */
export async function submitQuizResults({
  activityId,
  lessonId,
  materialId,
  organizationId,
  selectedAnswers,
  slug,
  durationSeconds,
}: SubmitQuizResultsParams): Promise<QuizSubmitOutcome> {
  try {
    const response = await fetch(`/api/courses/${slug}/lessons/${lessonId}/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: selectedAnswers,
        materialId: materialId || null,
        activityId: activityId || null,
        organizationId,
        durationSeconds,
      }),
    });

    const body = (await response.json()) as QuizSubmitResponseBody;

    if (response.status === 429) {
      return {
        status: "locked",
        message: body.message ?? null,
        retryAfter: body.details?.retryAfter ?? null,
      };
    }

    if (!response.ok || !body.result) {
      techDebtLogger.error("Error guardando quiz:", body.error);
      return { status: "error", message: body.message ?? body.error ?? null };
    }

    return { status: "ok", message: body.message ?? null, result: body.result };
  } catch (error) {
    techDebtLogger.error("Error al enviar quiz:", error);
    return { status: "error", message: null };
  }
}
