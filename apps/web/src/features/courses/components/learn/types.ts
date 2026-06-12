import type {
  ActivityConfig,
  ActivityEvaluationFeedback,
  ActivityEvaluationResultStatus,
  ActivitySubmissionStatus,
} from '@/features/courses/types/activity-config';
import type { ExternalToolDefinition } from '@/features/courses/config/external-tool-registry';
import type { QuizSubmissionSnapshot } from '@/features/courses/services/quiz-submission.service';

export type LearnLesson = {
  lesson_id: string;
  lesson_title: string;
  lesson_description?: string;
  lesson_order_index?: number;
  duration_seconds?: number;
  total_duration_minutes?: number;
  is_completed?: boolean;
  progress_percentage?: number;
  video_provider_id?: string;
  video_provider?: "youtube" | "vimeo" | "direct" | "custom";
};

export type LearnPathItem = {
  courseId: string;
  slug: string | null;
  title: string;
  position: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
};

export type LearnPathState = {
  learningPathId: string;
  title: string;
  description: string | null;
  currentCourseId: string;
  currentCourseUnlocked: boolean;
  progressPercentage: number;
  completedItemsCount: number;
  totalItemsCount: number;
  items: LearnPathItem[];
};

export type LearnPathBlockState = {
  message: string;
  learningPath: LearnPathState | null;
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
  enrollment_id?: string | null;
  organization_id?: string | null;
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
  | "ai_chat"
  | "reading"
  | "soflia_dialogue";

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
  activity_config?: ActivityConfig | null;
  activity_schema_version?: number;
  ai_prompts?: unknown;
  activity_order_index: number;
  external_tool?: ExternalToolDefinition | null;
  external_tool_key?: string | null;
  is_required: boolean;
  is_completed?: boolean;
  latest_submission_summary?: LearnActivitySubmissionSummary | null;
  requires_soflia_validation?: boolean;
};

export type LearnActivityEvaluation = {
  createdAt: string;
  evaluationId: string;
  feedback: ActivityEvaluationFeedback | null;
  resultStatus: ActivityEvaluationResultStatus;
};

export type LearnActivitySubmissionSummary = {
  completionSatisfied: boolean;
  lastValidatedAt: string | null;
  latestEvaluation: LearnActivityEvaluation | null;
  status: ActivitySubmissionStatus;
  submissionId: string;
  submittedAt: string | null;
  updatedAt: string | null;
};

export type LearnActivitySubmission = LearnActivitySubmissionSummary & {
  evidencePayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown>;
  responseText: string | null;
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
  | "activities"
  | "questions";

export type LessonQuizStatusItem = {
  completedAt: string | null;
  id: string;
  title: string;
  type: string;
  isCompleted: boolean;
  isPassed: boolean;
  latestSubmission: QuizSubmissionSnapshot | null;
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
  material_description?: string;
  material_type: string;
  is_required?: boolean;
};

export type LearnTranslationMissingPiece =
  | "lesson_text"
  | "transcript"
  | "summary"
  | "materials"
  | "activities";

export type LearnTranslationContext = {
  requestedLanguage: "es" | "en" | "pt";
  resolvedLanguage: "es" | "en" | "pt";
  usedFallback: boolean;
  missingPieces: LearnTranslationMissingPiece[];
};

export type LearnEditableNote = {
  id: string;
  lessonId?: string;
  title: string;
  content: string;
  tags: string[];
};

export type LearnSavedNote = {
  kind?: "manual";
  id: string;
  title: string;
  content: string;
  timestamp: string;
  lessonId: string;
  lessonTitle?: string;
  fullContent?: string;
  tags?: string[];
};

export type LearnNoteListItem = LearnSavedNote;

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

export type LearnLessonTranslationContextMap = Record<
  string,
  LearnTranslationContext | null
>;

export type LearnOrderedLesson = {
  lesson: LearnLesson;
  module: LearnModule;
};
