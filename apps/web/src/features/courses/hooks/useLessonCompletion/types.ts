import type { Dispatch, SetStateAction } from "react";
import type { TFunction } from "i18next";
import type {
  LearnLesson,
  LearnModule,
  LearnTab,
} from "../../components/learn/types";

export type Lesson = LearnLesson;
export type Module = LearnModule;
export type LearnTranslate = TFunction<"learn">;

export interface ValidationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  type: "activity" | "video" | "quiz";
  lessonId?: string;
  redirectTab?: LearnTab;
}

export interface LessonCompletionDetails {
  totalRequired: number;
  passed: number;
  message: string;
}

export interface LessonProgressApiResponse {
  code?: string;
  error?: string;
  details?: Partial<LessonCompletionDetails>;
  progress?: {
    overall_progress?: number;
  };
}

export interface UseLessonCompletionParams {
  slug: string;
  organizationId?: string | null;
  currentLesson: Lesson | null;
  modules: Module[];
  setModules: Dispatch<SetStateAction<Module[]>>;
  setCurrentLesson: Dispatch<SetStateAction<Lesson | null>>;
  setCourseProgress: Dispatch<SetStateAction<number>>;
  canCompleteLesson: (lessonId: string) => boolean;
}
