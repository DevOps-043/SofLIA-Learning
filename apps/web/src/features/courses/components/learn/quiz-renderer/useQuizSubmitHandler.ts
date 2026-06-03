"use client";

import { logger as techDebtLogger } from '@/lib/utils/logger'
import {
  buildQuizFeedbackPrompt,
  calculateQuizResults,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from "@/features/courses/components/learn/quiz.utils";
import { submitQuizResults } from "./quiz-submit.service";

interface UseQuizSubmitHandlerParams {
  activityId?: string;
  lessonId?: string;
  materialId?: string;
  normalizedQuizData: QuizQuestion[];
  onRequestQuizFeedback?: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void;
  onQuizSubmitted?: () => void;
  onTriggerLiaFeedback?: (prompt: string) => void;
  organizationId?: string | null;
  selectedAnswers: SelectedQuizAnswers;
  setIsSubmitting: (value: boolean) => void;
  setPointsEarned: (value: number) => void;
  setScore: (value: number) => void;
  setServerMessage: (message: string | null) => void;
  setShowResults: (value: boolean) => void;
  setSubmitError: (error: string | null) => void;
  slug?: string;
  totalPoints?: number;
}

export function useQuizSubmitHandler({
  activityId,
  lessonId,
  materialId,
  normalizedQuizData,
  onRequestQuizFeedback,
  onQuizSubmitted,
  onTriggerLiaFeedback,
  organizationId,
  selectedAnswers,
  setIsSubmitting,
  setPointsEarned,
  setScore,
  setServerMessage,
  setShowResults,
  setSubmitError,
  slug,
  totalPoints,
}: UseQuizSubmitHandlerParams) {
  return async (durationSeconds?: number) => {
    const unansweredQuestions = normalizedQuizData.filter(question => selectedAnswers[question.id] === undefined);

    if (unansweredQuestions.length > 0) {
      setSubmitError(`Por favor responde todas las preguntas (${unansweredQuestions.length} sin responder)`);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const results = calculateQuizResults(normalizedQuizData, selectedAnswers);
      if (lessonId && slug) {
        await submitQuizResults({
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
          durationSeconds,
        });
      }

      setScore(results.correctCount);
      setPointsEarned(results.pointsEarned);
      setShowResults(true);

      if (results.correctCount < normalizedQuizData.length) {
        const prompt = buildQuizFeedbackPrompt(normalizedQuizData, selectedAnswers);
        if (prompt) {
          if (onRequestQuizFeedback) {
            onRequestQuizFeedback(prompt, { activityId, materialId });
          } else {
            onTriggerLiaFeedback?.(prompt);
          }
        }
      }
    } catch (error) {
      techDebtLogger.error("Error procesando quiz:", error);
      setSubmitError("Error al procesar el quiz");
    } finally {
      setIsSubmitting(false);
    }
  };
}
