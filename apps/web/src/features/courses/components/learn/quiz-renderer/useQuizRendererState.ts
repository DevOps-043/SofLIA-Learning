import { useEffect, useMemo, useState } from "react";

import {
  normalizeQuizQuestions,
  type SelectedQuizAnswers,
} from "../quiz.utils";
import type { LessonQuizStatusItem } from "../types";
import type { QuizQuestion } from "../quiz.utils";
import {
  buildHydratedQuizState,
  getLatestSubmissionKey,
} from "./quiz-hydration";

interface UseQuizRendererStateParams {
  quizData: QuizQuestion[];
  quizStatusItem?: LessonQuizStatusItem;
}

export function useQuizRendererState({
  quizData,
  quizStatusItem,
}: UseQuizRendererStateParams) {
  const normalizedQuizData = useMemo(() => normalizeQuizQuestions(quizData), [quizData]);
  const initialHydratedState = useMemo(
    () => buildHydratedQuizState(normalizedQuizData, quizStatusItem),
    [normalizedQuizData, quizStatusItem],
  );
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedQuizAnswers>(
    initialHydratedState.selectedAnswers,
  );
  const [showResults, setShowResults] = useState(initialHydratedState.showResults);
  const [score, setScore] = useState(initialHydratedState.score);
  const [pointsEarned, setPointsEarned] = useState(initialHydratedState.pointsEarned);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [hydratedSubmissionKey, setHydratedSubmissionKey] = useState<string | null>(
    initialHydratedState.hydratedSubmissionKey,
  );
  const totalQuestions = normalizedQuizData.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passingThreshold = 80;
  const passed = percentage >= passingThreshold;
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
  }, [
    hydratedSubmissionKey,
    latestSubmissionKey,
    normalizedQuizData,
    quizStatusItem,
  ]);

  return {
    isSubmitting,
    normalizedQuizData,
    passed,
    passingThreshold,
    percentage,
    pointsEarned,
    score,
    selectedAnswers,
    serverMessage,
    setIsSubmitting,
    setPointsEarned,
    setScore,
    setSelectedAnswers,
    setServerMessage,
    setShowResults,
    setSubmitError,
    showResults,
    submitError,
    totalQuestions,
  };
}
