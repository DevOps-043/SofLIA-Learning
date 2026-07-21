import type { QuizQuestion, SelectedQuizAnswers } from "@/features/courses/components/learn/quiz.utils";
import type { LessonQuizStatusItem } from "@/features/courses/components/learn/types";

export type QuizRendererProps = {
  quizData: QuizQuestion[];
  totalPoints?: number;
  quizStatusItem?: LessonQuizStatusItem;
  lessonId?: string;
  slug?: string;
  materialId?: string;
  activityId?: string;
  onRequestQuizFeedback?: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void;
  onTriggerLiaFeedback?: (prompt: string) => void;
  // The SofLIA auto-note is generated asynchronously server-side; consumers
  // re-fetch the notes APIs instead of receiving it here.
  onQuizSubmitted?: () => void | Promise<void>;
};

export type HydratedQuizState = {
  hydratedSubmissionKey: string | null;
  pointsEarned: number;
  score: number;
  selectedAnswers: SelectedQuizAnswers;
  showResults: boolean;
};

/** Resultado por pregunta que el servidor revela SOLO después del envío. */
export type QuizPerQuestionResult = {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string | number;
  explanation: string | null;
  points: number;
};

export type QuizServerResult = {
  score: number;
  totalQuestions: number;
  totalPoints: number;
  pointsEarned: number;
  percentage: number;
  isPassed: boolean;
  perQuestion: QuizPerQuestionResult[];
  attemptsRemaining: number | null;
  maxAttempts: number;
};

export type QuizSubmitOutcome =
  | { status: "ok"; message: string | null; result: QuizServerResult }
  | { status: "locked"; message: string | null; retryAfter: string | null }
  | { status: "error"; message: string | null };

/** Clave de respuestas revelada tras el envío, para renderizar el repaso. */
export type QuizAnswerKeyMap = Record<
  string,
  { correctAnswer: string | number; explanation: string | null }
>;

/** Estado del límite de intentos con cooldown. */
export type QuizAttemptState = {
  attemptsRemaining: number | null;
  maxAttempts: number | null;
  isLocked: boolean;
  retryAfter: string | null;
};

export type SubmitQuizResultsParams = {
  activityId?: string;
  lessonId: string;
  materialId?: string;
  organizationId?: string | null;
  selectedAnswers: SelectedQuizAnswers;
  slug: string;
  durationSeconds?: number;
};
