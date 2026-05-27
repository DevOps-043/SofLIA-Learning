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
  onQuizSubmitted?: () => void;
};

export type HydratedQuizState = {
  hydratedSubmissionKey: string | null;
  pointsEarned: number;
  score: number;
  selectedAnswers: SelectedQuizAnswers;
  showResults: boolean;
};

export type SubmitQuizResultsParams = {
  activityId?: string;
  lessonId: string;
  materialId?: string;
  normalizedQuizData: QuizQuestion[];
  organizationId?: string | null;
  onQuizSubmitted?: () => void;
  selectedAnswers: SelectedQuizAnswers;
  setServerMessage: (message: string | null) => void;
  setSubmitError: (error: string | null) => void;
  slug: string;
  totalPoints?: number;
};
