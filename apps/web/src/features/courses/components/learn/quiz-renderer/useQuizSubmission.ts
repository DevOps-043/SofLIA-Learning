import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  buildQuizFeedbackPrompt,
  calculateQuizResults,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from "../quiz.utils";
import { submitQuizResults } from "./quiz-submit.service";

interface UseQuizSubmissionParams {
  activityId?: string;
  lessonId?: string;
  materialId?: string;
  normalizedQuizData: QuizQuestion[];
  onQuizSubmitted?: () => void;
  onTriggerLiaFeedback?: (prompt: string) => void;
  organizationId?: string | null;
  selectedAnswers: SelectedQuizAnswers;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  setPointsEarned: Dispatch<SetStateAction<number>>;
  setScore: Dispatch<SetStateAction<number>>;
  setSelectedAnswers: Dispatch<SetStateAction<SelectedQuizAnswers>>;
  setServerMessage: Dispatch<SetStateAction<string | null>>;
  setShowResults: Dispatch<SetStateAction<boolean>>;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  slug?: string;
  totalPoints?: number;
}

export function useQuizSubmission({
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
  setSelectedAnswers,
  setServerMessage,
  setShowResults,
  setSubmitError,
  slug,
  totalPoints,
}: UseQuizSubmissionParams) {
  const handleAnswerSelect = useCallback(
    (questionId: string, answer: string | number) => {
      setSelectedAnswers((currentAnswers) => ({ ...currentAnswers, [questionId]: answer }));
    },
    [setSelectedAnswers],
  );

  const handleSubmit = useCallback(async () => {
    const unansweredQuestions = normalizedQuizData.filter(
      (question) => selectedAnswers[question.id] === undefined,
    );

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
          activityId, lessonId, materialId, normalizedQuizData, onQuizSubmitted,
          onTriggerLiaFeedback, organizationId, selectedAnswers, setIsSubmitting,
          setPointsEarned, setScore, setSelectedAnswers, setServerMessage,
          setShowResults, setSubmitError, slug, totalPoints,
        });
      }
    } catch (error) {
      console.error('[useQuizSubmission] handleSubmit failed', error);
      setSubmitError('Error al procesar el quiz');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activityId, lessonId, materialId, normalizedQuizData, onQuizSubmitted,
    onTriggerLiaFeedback, organizationId, selectedAnswers, setIsSubmitting,
    setPointsEarned, setScore, setSelectedAnswers, setServerMessage,
    setShowResults, setSubmitError, slug, totalPoints,
  ]);

  const handleRetry = useCallback(() => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setPointsEarned(0);
    setSubmitError(null);
    setServerMessage(null);
  }, [setPointsEarned, setScore, setSelectedAnswers, setServerMessage, setShowResults, setSubmitError]);

  return { handleAnswerSelect, handleRetry, handleSubmit };
}
