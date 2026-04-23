import type {
  QuizQuestion,
  SelectedQuizAnswers,
} from "../quiz.utils";

export type SubmitQuizResultsParams = {
  activityId?: string;
  lessonId: string;
  materialId?: string;
  normalizedQuizData: QuizQuestion[];
  organizationId?: string | null;
  onQuizSubmitted?: () => void;
  selectedAnswers: SelectedQuizAnswers;
  setServerMessage: (message: string | null) => void;
  setSubmitError: (error: string | null) => void;
  slug: string;
  totalPoints?: number;
};

interface QuizSubmitResponse {
  error?: string;
  message?: string;
  result?: {
    submission?: {
      submission_id?: string;
    };
  };
}

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

    const result = (await response.json()) as QuizSubmitResponse;

    if (!response.ok) {
      console.error("Error guardando quiz:", result.error);
      setSubmitError(result.error || "Error al guardar las respuestas");
      return;
    }

    if (result.message) {
      setServerMessage(result.message);
    }

    onQuizSubmitted?.();
  } catch (error) {
    console.error("Error al enviar quiz:", error);
    setSubmitError("Error al guardar las respuestas");
  }
}
