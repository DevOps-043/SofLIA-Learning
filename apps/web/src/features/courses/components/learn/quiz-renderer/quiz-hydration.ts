import { calculateQuizResults, type QuizQuestion, type SelectedQuizAnswers } from "@/features/courses/components/learn/quiz.utils";
import type { LessonQuizStatusItem } from "@/features/courses/components/learn/types";
import type { HydratedQuizState } from "./quiz-renderer.types";

export function getLatestSubmissionKey(quizStatusItem?: LessonQuizStatusItem): string | null {
  const latestSubmission = quizStatusItem?.latestSubmission;
  return latestSubmission
    ? `${latestSubmission.submissionId}:${latestSubmission.completedAt ?? ""}`
    : null;
}

export function toSelectedQuizAnswers(userAnswers: SelectedQuizAnswers | undefined): SelectedQuizAnswers {
  return userAnswers ? { ...userAnswers } : {};
}

export function buildHydratedQuizState(
  normalizedQuizData: QuizQuestion[],
  quizStatusItem?: LessonQuizStatusItem,
): HydratedQuizState {
  const latestSubmission = quizStatusItem?.latestSubmission;

  if (!latestSubmission) {
    return { hydratedSubmissionKey: null, pointsEarned: 0, score: 0, selectedAnswers: {}, showResults: false };
  }

  const selectedAnswers = toSelectedQuizAnswers(latestSubmission.userAnswers);
  const results = calculateQuizResults(normalizedQuizData, selectedAnswers);

  return {
    hydratedSubmissionKey: getLatestSubmissionKey(quizStatusItem),
    pointsEarned: latestSubmission.pointsEarned ?? results.pointsEarned,
    score: latestSubmission.score,
    selectedAnswers,
    showResults: true,
  };
}
