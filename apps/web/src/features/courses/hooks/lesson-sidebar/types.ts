import type { Dispatch, SetStateAction } from "react";

import type {
  LearnActivityMap,
  LearnLesson,
  LearnLessonQuizStatusMap,
  LearnLessonTranslationContextMap,
  LearnMaterialMap,
  LearnModule,
} from "../../components/learn/types";

export type UseLessonSidebarStateParams = {
  slug: string;
  selectedLang: "es" | "en" | "pt";
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  isMobile: boolean;
};

export type LessonSidebarMaps = {
  lessonsActivities: LearnActivityMap;
  lessonsMaterials: LearnMaterialMap;
  lessonsQuizStatus: LearnLessonQuizStatusMap;
  lessonTranslationContexts: LearnLessonTranslationContextMap;
};

export type ExpansionSetters = {
  setExpandedLessons: Dispatch<SetStateAction<Set<string>>>;
  setExpandedModules: Dispatch<SetStateAction<Set<string>>>;
};
