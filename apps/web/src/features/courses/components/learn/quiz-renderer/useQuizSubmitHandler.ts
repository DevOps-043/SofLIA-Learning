"use client";

import { logger as techDebtLogger } from '@/lib/utils/logger'
import {
  buildQuizFeedbackPrompt,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from "@/features/courses/components/learn/quiz.utils";
import { submitQuizResults } from "./quiz-submit.service";
import type {
  QuizAnswerKeyMap,
  QuizAttemptState,
} from "./quiz-renderer.types";

interface UseQuizSubmitHandlerParams {
  activityId?: string;
  lessonId?: string;
  materialId?: string;
  normalizedQuizData: QuizQuestion[];
  onRequestQuizFeedback?: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void;
  onQuizSubmitted?: () => void | Promise<void>;
  onTriggerLiaFeedback?: (prompt: string) => void;
  organizationId?: string | null;
  selectedAnswers: SelectedQuizAnswers;
  setAnswerKey: (answerKey: QuizAnswerKeyMap) => void;
  setAttemptState: (state: QuizAttemptState) => void;
  setIsSubmitting: (value: boolean) => void;
  setPointsEarned: (value: number) => void;
  setScore: (value: number) => void;
  setServerMessage: (message: string | null) => void;
  setShowResults: (value: boolean) => void;
  setSubmitError: (error: string | null) => void;
  slug?: string;
}

function mergeAnswerKey(
  questions: QuizQuestion[],
  answerKey: QuizAnswerKeyMap,
): QuizQuestion[] {
  return questions.map((question) => {
    const entry = answerKey[question.id];
    if (!entry) return question;
    return {
      ...question,
      correctAnswer: entry.correctAnswer,
      explanation: entry.explanation ?? question.explanation,
    };
  });
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
  setAnswerKey,
  setAttemptState,
  setIsSubmitting,
  setPointsEarned,
  setScore,
  setServerMessage,
  setShowResults,
  setSubmitError,
  slug,
}: UseQuizSubmitHandlerParams) {
  return async (durationSeconds?: number) => {
    const unansweredQuestions = normalizedQuizData.filter(
      (question) => selectedAnswers[question.id] === undefined,
    );

    if (unansweredQuestions.length > 0) {
      setSubmitError(
        `Por favor responde todas las preguntas (${unansweredQuestions.length} sin responder)`,
      );
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (!lessonId || !slug) {
        return;
      }

      const outcome = await submitQuizResults({
        activityId,
        lessonId,
        materialId,
        organizationId,
        selectedAnswers,
        slug,
        durationSeconds,
      });

      if (outcome.status === "locked") {
        setAttemptState({
          attemptsRemaining: 0,
          maxAttempts: null,
          isLocked: true,
          retryAfter: outcome.retryAfter,
        });
        setServerMessage(outcome.message);
        setSubmitError(outcome.message);
        return;
      }

      if (outcome.status === "error") {
        setSubmitError(outcome.message ?? "Error al guardar las respuestas");
        return;
      }

      const { result } = outcome;
      const answerKey: QuizAnswerKeyMap = Object.fromEntries(
        result.perQuestion.map((perQuestion) => [
          perQuestion.questionId,
          {
            correctAnswer: perQuestion.correctAnswer,
            explanation: perQuestion.explanation,
          },
        ]),
      );

      setAnswerKey(answerKey);
      setScore(result.score);
      setPointsEarned(result.pointsEarned);
      setServerMessage(outcome.message);
      setAttemptState({
        attemptsRemaining: result.attemptsRemaining,
        maxAttempts: result.maxAttempts,
        isLocked: false,
        retryAfter: null,
      });
      setShowResults(true);

      await onQuizSubmitted?.();

      if (result.score < normalizedQuizData.length) {
        const merged = mergeAnswerKey(normalizedQuizData, answerKey);
        const prompt = buildQuizFeedbackPrompt(merged, selectedAnswers);
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
