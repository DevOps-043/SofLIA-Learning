import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { SubmitQuizResultsParams } from "./quiz-renderer.types";

export async function submitQuizResults({
  activityId,
  lessonId,
  materialId,
  normalizedQuizData,
  organizationId,
  onQuizSubmitted,
  selectedAnswers,
  setServerMessage,
  setSubmitError,
  slug,
  totalPoints,
}: SubmitQuizResultsParams): Promise<void> {
  try {
    const response = await fetch(`/api/courses/${slug}/lessons/${lessonId}/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: selectedAnswers,
        quizData: normalizedQuizData,
        materialId: materialId || null,
        activityId: activityId || null,
        organizationId,
        totalPoints,
      }),
    });

    const result = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      techDebtLogger.error("Error guardando quiz:", result.error);
      setSubmitError(result.error || "Error al guardar las respuestas");
      return;
    }

    if (result.message) {
      setServerMessage(result.message);
    }

    onQuizSubmitted?.();
  } catch (error) {
    techDebtLogger.error("Error al enviar quiz:", error);
    setSubmitError("Error al guardar las respuestas");
  }
}
