"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import { normalizeQuizQuestions, type SelectedQuizAnswers } from "@/features/courses/components/learn/quiz.utils";
import { buildHydratedQuizState, getLatestSubmissionKey } from "./quiz-hydration";
import type { QuizRendererProps } from "./quiz-renderer.types";
import { useQuizSubmitHandler } from "./useQuizSubmitHandler";

const PASSING_THRESHOLD = 80;

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
  totalPoints,
}: QuizRendererProps) {
  const organizationId = useCurrentOrganizationId();
  const normalizedQuizData = useMemo(() => normalizeQuizQuestions(quizData), [quizData]);
  const initialState = useMemo(
    () => buildHydratedQuizState(normalizedQuizData, quizStatusItem),
    [normalizedQuizData, quizStatusItem],
  );
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedQuizAnswers>(initialState.selectedAnswers);
  const [showResults, setShowResults] = useState(initialState.showResults);
  const [score, setScore] = useState(initialState.score);
  const [pointsEarned, setPointsEarned] = useState(initialState.pointsEarned);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [hydratedSubmissionKey, setHydratedSubmissionKey] = useState<string | null>(initialState.hydratedSubmissionKey);
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const totalQuestions = normalizedQuizData.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= PASSING_THRESHOLD;
  const latestSubmissionKey = getLatestSubmissionKey(quizStatusItem);

  useEffect(() => {
    if (!latestSubmissionKey || latestSubmissionKey === hydratedSubmissionKey) {
      return;
    }

    const nextHydratedState = buildHydratedQuizState(normalizedQuizData, quizStatusItem);
    setSelectedAnswers(nextHydratedState.selectedAnswers);
    setShowResults(nextHydratedState.showResults);
    setScore(nextHydratedState.score);
    setPointsEarned(nextHydratedState.pointsEarned);
    setSubmitError(null);
    setHydratedSubmissionKey(nextHydratedState.hydratedSubmissionKey);
  }, [hydratedSubmissionKey, latestSubmissionKey, normalizedQuizData, quizStatusItem]);

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
    setStartTime(Date.now());
  };

  const submitHandler = useQuizSubmitHandler({
    activityId,
    lessonId,
    materialId,
    normalizedQuizData,
    onQuizSubmitted,
    onRequestQuizFeedback,
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
  });

  const handleSubmit = async () => {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    await submitHandler(elapsedSeconds);
  };

  return {
    handleAnswerSelect,
    handleRetry,
    handleSubmit,
    isSubmitting,
    normalizedQuizData,
    passed,
    passingThreshold: PASSING_THRESHOLD,
    percentage,
    pointsEarned,
    score,
    selectedAnswers,
    serverMessage,
    showResults,
    submitError,
    totalQuestions,
  };
}
