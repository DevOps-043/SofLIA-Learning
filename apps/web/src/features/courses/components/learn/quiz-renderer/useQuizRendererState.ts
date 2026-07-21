"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import { normalizeQuizQuestions, type QuizQuestion, type SelectedQuizAnswers } from "@/features/courses/components/learn/quiz.utils";
import { buildHydratedQuizState, getLatestSubmissionKey } from "./quiz-hydration";
import type {
  QuizAnswerKeyMap,
  QuizAttemptState,
  QuizRendererProps,
} from "./quiz-renderer.types";
import { useQuizSubmitHandler } from "./useQuizSubmitHandler";

const PASSING_THRESHOLD = 80;

const INITIAL_ATTEMPT_STATE: QuizAttemptState = {
  attemptsRemaining: null,
  maxAttempts: null,
  isLocked: false,
  retryAfter: null,
};

function mergeAnswerKey(
  questions: QuizQuestion[],
  answerKey: QuizAnswerKeyMap,
): QuizQuestion[] {
  if (Object.keys(answerKey).length === 0) return questions;
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

export function useQuizRendererState({
  activityId,
  lessonId,
  materialId,
  onQuizSubmitted,
  onRequestQuizFeedback,
  onTriggerLiaFeedback,
  quizData,
  quizStatusItem,
  slug,
}: QuizRendererProps) {
  const params = useParams();
  const currentOrganizationId = useCurrentOrganizationId();
  const routeOrgSlug = params?.orgSlug;
  const organizationId = routeOrgSlug ? currentOrganizationId : null;
  const baseQuizData = useMemo(() => normalizeQuizQuestions(quizData), [quizData]);
  const initialState = useMemo(
    () => buildHydratedQuizState(baseQuizData, quizStatusItem),
    [baseQuizData, quizStatusItem],
  );
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedQuizAnswers>(initialState.selectedAnswers);
  const [showResults, setShowResults] = useState(initialState.showResults);
  const [score, setScore] = useState(initialState.score);
  const [pointsEarned, setPointsEarned] = useState(initialState.pointsEarned);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [answerKey, setAnswerKey] = useState<QuizAnswerKeyMap>({});
  const [attemptState, setAttemptState] = useState<QuizAttemptState>(INITIAL_ATTEMPT_STATE);
  const [hydratedSubmissionKey, setHydratedSubmissionKey] = useState<string | null>(initialState.hydratedSubmissionKey);
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  // La clave de respuestas solo se conoce tras enviar en esta sesión (el payload de
  // carga ya no la incluye). En hidratación de un intento previo no está disponible,
  // por lo que el resaltado por-pregunta se muestra neutro (no falsos "incorrecto").
  const answerKeyKnown = Object.keys(answerKey).length > 0;
  const normalizedQuizData = useMemo(
    () => mergeAnswerKey(baseQuizData, answerKey),
    [baseQuizData, answerKey],
  );
  const totalQuestions = normalizedQuizData.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= PASSING_THRESHOLD;
  const latestSubmissionKey = getLatestSubmissionKey(quizStatusItem);

  useEffect(() => {
    if (!latestSubmissionKey || latestSubmissionKey === hydratedSubmissionKey) {
      return;
    }

    const nextHydratedState = buildHydratedQuizState(baseQuizData, quizStatusItem);
    setSelectedAnswers(nextHydratedState.selectedAnswers);
    setShowResults(nextHydratedState.showResults);
    setScore(nextHydratedState.score);
    setPointsEarned(nextHydratedState.pointsEarned);
    setSubmitError(null);
    setHydratedSubmissionKey(nextHydratedState.hydratedSubmissionKey);
  }, [hydratedSubmissionKey, latestSubmissionKey, baseQuizData, quizStatusItem]);

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setSelectedAnswers(currentAnswers => ({ ...currentAnswers, [questionId]: answer }));
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setPointsEarned(0);
    setSubmitError(null);
    setServerMessage(null);
    setAnswerKey({});
    setStartTime(Date.now());
  };

  const submitHandler = useQuizSubmitHandler({
    activityId,
    lessonId,
    materialId,
    normalizedQuizData: baseQuizData,
    onQuizSubmitted,
    onRequestQuizFeedback,
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
  });

  const handleSubmit = async () => {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    await submitHandler(elapsedSeconds);
  };

  return {
    answerKeyKnown,
    attemptsRemaining: attemptState.attemptsRemaining,
    handleAnswerSelect,
    handleRetry,
    handleSubmit,
    isLocked: attemptState.isLocked,
    isSubmitting,
    maxAttempts: attemptState.maxAttempts,
    normalizedQuizData,
    passed,
    passingThreshold: PASSING_THRESHOLD,
    percentage,
    pointsEarned,
    retryAfter: attemptState.retryAfter,
    score,
    selectedAnswers,
    serverMessage,
    showResults,
    submitError,
    totalQuestions,
  };
}
