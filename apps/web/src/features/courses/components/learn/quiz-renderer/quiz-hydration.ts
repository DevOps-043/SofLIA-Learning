import {
  calculateQuizResults,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from "../quiz.utils";
import type { LessonQuizStatusItem } from "../types";
import type { QuizSubmissionAnswers } from "@/features/courses/services/quiz-submission.service";
import type { HydratedQuizState } from "./QuizRenderer.types";

function toSelectedQuizAnswers(
  userAnswers: QuizSubmissionAnswers | undefined,
): SelectedQuizAnswers {
  if (!userAnswers) {
    return {};
  }

  return { ...userAnswers };
}

export function buildHydratedQuizState(
  normalizedQuizData: QuizQuestion[],
  quizStatusItem?: LessonQuizStatusItem,
): HydratedQuizState {
  const latestSubmission = quizStatusItem?.latestSubmission;

  if (!latestSubmission) {
    return {
      hydratedSubmissionKey: null,
      pointsEarned: 0,
      score: 0,
      selectedAnswers: {},
      showResults: false,
    };
  }

  const selectedAnswers = toSelectedQuizAnswers(latestSubmission.userAnswers);
  const results = calculateQuizResults(normalizedQuizData, selectedAnswers);

  return {
    hydratedSubmissionKey: `${latestSubmission.submissionId}:${latestSubmission.completedAt ?? ""}`,
    pointsEarned: results.pointsEarned,
    score: latestSubmission.score,
    selectedAnswers,
    showResults: true,
  };
}

export function getLatestSubmissionKey(quizStatusItem?: LessonQuizStatusItem) {
  const latestSubmission = quizStatusItem?.latestSubmission;

  if (!latestSubmission) {
    return null;
  }

  return `${latestSubmission.submissionId}:${latestSubmission.completedAt ?? ""}`;
}
