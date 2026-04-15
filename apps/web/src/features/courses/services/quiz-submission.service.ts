export type QuizSubmissionAnswerValue = number | string;

export type QuizSubmissionAnswers = Record<string, QuizSubmissionAnswerValue>;

export interface QuizSubmissionSnapshot {
  completedAt: string | null;
  score: number;
  submissionId: string;
  userAnswers: QuizSubmissionAnswers;
}

interface BuildQuizSubmissionSnapshotInput {
  completedAt?: string | null;
  score?: number | null;
  submissionId?: string | null;
  userAnswers?: unknown;
}

function isQuizSubmissionAnswerValue(
  value: unknown
): value is QuizSubmissionAnswerValue {
  return typeof value === "number" || typeof value === "string";
}

export function parseQuizSubmissionAnswers(
  value: unknown
): QuizSubmissionAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<QuizSubmissionAnswers>(
    (answers, [questionId, answerValue]) => {
      if (!questionId || !isQuizSubmissionAnswerValue(answerValue)) {
        return answers;
      }

      answers[questionId] = answerValue;
      return answers;
    },
    {}
  );
}

export function buildQuizSubmissionSnapshot({
  completedAt,
  score,
  submissionId,
  userAnswers,
}: BuildQuizSubmissionSnapshotInput): QuizSubmissionSnapshot | null {
  if (!submissionId) {
    return null;
  }

  return {
    completedAt: typeof completedAt === "string" ? completedAt : null,
    score: typeof score === "number" ? score : 0,
    submissionId,
    userAnswers: parseQuizSubmissionAnswers(userAnswers),
  };
}
