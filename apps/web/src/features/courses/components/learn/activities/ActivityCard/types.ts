import type { LearnActivity, LessonQuizStatus } from '../../types';

export type ActivityCardProps = {
  activity: LearnActivity;
  isCollapsed: boolean;
  lessonId: string;
  onQuizSubmitted: () => void | Promise<void>;
  onRequestQuizFeedback: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void | Promise<void>;
  onToggle: (activityId: string) => void;
  onTriggerLiaFeedback: (prompt: string) => void | Promise<void>;
  quizStatus: LessonQuizStatus | null;
  slug: string;
};
