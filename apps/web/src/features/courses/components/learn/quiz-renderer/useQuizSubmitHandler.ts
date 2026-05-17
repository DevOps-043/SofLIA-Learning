"use client";

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
  return async () => {
    const unansweredQuestions = normalizedQuizData.filter(question => selectedAnswers[question.id] === undefined);

    if (unansweredQuestions.length > 0) {
      setSubmitError(`Por favor responde todas las preguntas (${unansweredQuestions.length} sin responder)`);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const results = calculateQuizResults(normalizedQuizData, selectedAnswers);
      setScore(results.correctCount);
      setPointsEarned(results.pointsEarned);
      setShowResults(true);

      if (results.correctCount < normalizedQuizData.length && onTriggerLiaFeedback) {
        const prompt = buildQuizFeedbackPrompt(normalizedQuizData, selectedAnswers);
        if (prompt) onTriggerLiaFeedback(prompt);
      }

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
        });
      }
    } catch (error) {
      console.error("Error procesando quiz:", error);
      setSubmitError("Error al procesar el quiz");
    } finally {
      setIsSubmitting(false);
    }
  };
}
