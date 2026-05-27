import type {
  GenerateRoleBasedPrompts,
  LearnActivity,
} from '../../types';
import type { LessonContentSnapshot } from '../../../../services/lesson-content.client';

export type { LessonContentSnapshot };

export type LessonFeedback = 'like' | 'dislike' | null;

export interface UseActivitiesDataOptions {
  initialContent?: LessonContentSnapshot | null;
  lessonId?: string;
  slug: string;
  selectedLang: string;
  onPromptsChange?: (prompts: string[]) => void;
  userRole?: string;
  generateRoleBasedPrompts?: GenerateRoleBasedPrompts;
  onLessonContentRefresh?: (lessonId: string, forceRefresh?: boolean) => void | Promise<void>;
}

export interface PromptSource {
  prompts: string[];
  content: string;
  title: string;
}
