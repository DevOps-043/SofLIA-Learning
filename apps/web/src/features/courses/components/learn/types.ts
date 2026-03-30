export type LearnLesson = {
  lesson_id: string;
  lesson_title: string;
  lesson_description?: string;
  lesson_order_index?: number;
  duration_seconds?: number;
  is_completed?: boolean;
  progress_percentage?: number;
  video_provider_id?: string;
  video_provider?: "youtube" | "vimeo" | "direct" | "custom";
};

export type LearnModule = {
  module_id: string;
  module_title: string;
  module_order_index: number;
  lessons: LearnLesson[];
};

export type LearnCourseData = {
  id: string;
  course_id?: string;
  title?: string;
  course_title?: string;
  description?: string;
  course_description?: string;
  thumbnail?: string;
  course_thumbnail?: string;
};

export type LearnActivityType =
  | "reflection"
  | "exercise"
  | "quiz"
  | "discussion"
  | "ai_chat";

export type LearnMaterialType =
  | "pdf"
  | "link"
  | "document"
  | "quiz"
  | "exercise"
  | "reading";

export type LearnActivity = {
  activity_id: string;
  activity_title: string;
  activity_description?: string;
  activity_type: LearnActivityType;
  activity_content: unknown;
  ai_prompts?: unknown;
  activity_order_index: number;
  is_required: boolean;
  is_completed?: boolean;
};

export type LearnMaterial = {
  material_id: string;
  material_title: string;
  material_description?: string;
  material_type: LearnMaterialType;
  file_url?: string;
  external_url?: string;
  content_data?: unknown;
  material_order_index: number;
  is_downloadable: boolean;
  is_required?: boolean;
};

export type LearnColors = {
  accent: string;
  primary: string;
  bgPrimary: string;
  bgSecondary: string;
};

export type LearnTab =
  | "video"
  | "transcript"
  | "summary"
  | "activities"
  | "questions";

export type LessonQuizStatusItem = {
  id: string;
  title: string;
  type: string;
  isCompleted: boolean;
  isPassed: boolean;
  percentage: number;
};

export type LessonQuizStatus = {
  hasRequiredQuizzes: boolean;
  totalRequiredQuizzes: number;
  completedQuizzes: number;
  passedQuizzes: number;
  allQuizzesPassed: boolean;
  quizzes: LessonQuizStatusItem[];
};

export type LearnLessonQuizStatusMap = Record<string, LessonQuizStatus | null>;

export type GenerateRoleBasedPrompts = (
  basePrompts: string[],
  activityContent: string,
  activityTitle: string,
  userRole?: string
) => Promise<string[]>;

export type LearnActivitySummary = {
  activity_id: string;
  activity_title: string;
  activity_description?: string;
  activity_type: string;
  is_required: boolean;
  is_completed?: boolean;
};

export type LearnMaterialSummary = {
  material_id: string;
  material_title: string;
  material_type: string;
  is_required?: boolean;
};

export type LearnEditableNote = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

export type LearnSavedNote = {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  lessonId: string;
  fullContent?: string;
  tags?: string[];
};

export type LearnNotesStats = {
  totalNotes: number;
  lessonsWithNotes: string;
  lastUpdate: string;
};

export type LearnNoteFormData = {
  title: string;
  content: string;
  tags: string[];
};

export type LearnActivityMap = Record<string, LearnActivitySummary[]>;

export type LearnMaterialMap = Record<string, LearnMaterialSummary[]>;

export type LearnOrderedLesson = {
  lesson: LearnLesson;
  module: LearnModule;
};
