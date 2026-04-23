import type {
  LearnActivitySummary,
  LearnLesson,
  LearnTab,
} from '../types';

export type VideoContentProps = {
  activities: LearnActivitySummary[];
  canCompleteLesson: (lessonId: string) => boolean;
  getNextLesson: () => LearnLesson | null;
  getPreviousLesson: () => LearnLesson | null;
  hasActivities: boolean;
  isSummaryLoading: boolean;
  isTranscriptLoading: boolean;
  lesson: LearnLesson;
  markLessonAsCompleted: (lessonId: string) => Promise<boolean>;
  onCannotComplete: () => void;
  onCompleteCourse?: () => void | Promise<void>;
  onCourseCompleted: () => void;
  onNavigateNext: () => void | Promise<void>;
  onNavigatePrevious: () => void;
  onNoteCreated: (noteData: unknown, lessonId: string) => void;
  onStatsUpdate: (
    operation: 'create' | 'update' | 'delete',
    lessonId?: string
  ) => Promise<void>;
  onVideoCompleted: (lessonId: string) => void;
  selectedLang?: string;
  setActiveTab: (tab: LearnTab) => void;
  skipVideoAutoplay?: boolean;
  slug: string;
  summaryContent: string | null;
  suppressVideoPlayback?: boolean;
  transcriptContent: string | null;
};
