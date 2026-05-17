import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  LearnActivityMap,
  LearnLesson,
  LearnMaterialMap,
  LearnOrderedLesson,
  LearnTab,
} from "../../components/learn/types";

export type TrackUserAction = (
  action: string,
  metadata?: Record<string, unknown>
) => void;

export type PauseAllVideosContext = {
  pauseAllVideos?: () => void;
  saveVideoProgress?: (lessonId: string, time: number) => void;
} | null;

export type OpenValidationModal = (modal: {
  title: string;
  message: string;
  details?: string;
  type: "activity" | "video" | "quiz";
  lessonId?: string;
  redirectTab?: LearnTab;
}) => void;

export type OpenLessonOptions = {
  tab?: LearnTab;
  trackOpen?: boolean;
};

export type ActivityShortcutTarget = {
  activityId: string;
  contentType?: "activity" | "material";
  lesson: LearnLesson;
};

export type UseLessonNavigationParams = {
  orderedLessons: LearnOrderedLesson[];
  modules: Array<{ module_id: string; lessons: LearnLesson[] }>;
  currentLesson: LearnLesson | null;
  lessonsActivities: LearnActivityMap;
  lessonsMaterials: LearnMaterialMap;
  setCurrentLesson: Dispatch<SetStateAction<LearnLesson | null>>;
  setActiveTab: Dispatch<SetStateAction<LearnTab>>;
  markLessonAsCompleted: (lessonId: string, signal?: AbortSignal) => Promise<boolean>;
  loadLessonActivitiesAndMaterials: (lessonId: string, forceRefresh?: boolean) => Promise<void>;
  openValidationModal: OpenValidationModal;
  onActivityFocus?: (contentId: string, contentType?: "activity" | "material") => void;
  trackUserAction: TrackUserAction;
  videoPlayerContext?: PauseAllVideosContext;
};

export type PendingValidationRef = MutableRefObject<AbortController | null>;

export type UseActivityShortcutParams = {
  cancelPendingValidation: () => void;
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
  pendingValidationRef: PendingValidationRef;
  saveCurrentLessonVideoProgress: (lessonId?: string | null) => void;
  showIncompleteVideoModal: () => void;
};

export type UseLessonChangeParams = UseActivityShortcutParams;
