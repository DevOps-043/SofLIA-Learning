import type {
  GenerateRoleBasedPrompts,
  LearnActivity,
  LearnLesson,
} from "../types";
import type { useActivitiesData } from "../activities/useActivitiesData";

export type ActivitiesData = ReturnType<typeof useActivitiesData>;
export type { LearnActivity };

export type ActivitiesContentProps = {
  focusedActivityId?: string | null;
  focusedMaterialId?: string | null;
  generateRoleBasedPrompts?: GenerateRoleBasedPrompts;
  hasNextLesson?: boolean;
  lesson: LearnLesson;
  onActivityFocused?: () => void;
  onCompleteCourse?: () => void | Promise<void>;
  onLessonContentRefresh?: (
    lessonId: string,
    forceRefresh?: boolean
  ) => void | Promise<void>;
  onNavigateNext?: () => void | Promise<void>;
  onPromptsChange?: (prompts: string[]) => void;
  selectedLang: string;
  slug: string;
  userRole?: string;
};
