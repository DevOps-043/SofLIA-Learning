import type { LessonQuizStatusItem } from "../types";
import type {
  QuizQuestion,
  SelectedQuizAnswers,
} from "../quiz.utils";

export type QuizRendererProps = {
  quizData: QuizQuestion[];
  totalPoints?: number;
  quizStatusItem?: LessonQuizStatusItem;
  lessonId?: string;
  slug?: string;
  materialId?: string;
  activityId?: string;
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
