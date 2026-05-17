import type {
  GenerateRoleBasedPrompts,
  LearnActivity,
  LearnMaterial,
  LessonQuizStatus,
} from '../../types';

export type LessonFeedback = 'like' | 'dislike' | null;

export interface UseActivitiesDataOptions {
  lessonId?: string;
  slug: string;
  selectedLang: string;
  onPromptsChange?: (prompts: string[]) => void;
  userRole?: string;
  generateRoleBasedPrompts?: GenerateRoleBasedPrompts;
  onLessonContentRefresh?: (lessonId: string, forceRefresh?: boolean) => void | Promise<void>;
}

export interface LessonContentSnapshot {
  activities: LearnActivity[];
  materials: LearnMaterial[];
  quizStatus: LessonQuizStatus | null;
}

export interface PromptSource {
  prompts: string[];
  content: string;
  title: string;
}
