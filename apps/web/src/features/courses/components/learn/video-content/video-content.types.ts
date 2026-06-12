import type { MutableRefObject } from "react";
import type { useVideoPlayerOptional } from "@/app/courses/[slug]/learn/VideoPlayerContext";
import type { LearnActivitySummary, LearnLesson, LearnTab } from "../types";

export type VideoPlayerContextValue = NonNullable<ReturnType<typeof useVideoPlayerOptional>>;

export type VideoContentProps = {
  lesson: LearnLesson;
  enrollmentId?: string | null;
  organizationId?: string | null;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void | Promise<void>;
  onVideoCompleted: (lessonId: string) => void;
  getPreviousLesson: () => LearnLesson | null;
  getNextLesson: () => LearnLesson | null;
  markLessonAsCompleted: (lessonId: string) => Promise<boolean>;
  canCompleteLesson: (lessonId: string) => boolean;
  onCourseCompleted: () => void;
  onCannotComplete: () => void;
  hasActivities: boolean;
  activities: LearnActivitySummary[];
  isSummaryLoading: boolean;
  isTranscriptLoading: boolean;
  onNoteCreated: (noteData: unknown, lessonId: string) => void;
  setActiveTab: (tab: LearnTab) => void;
  onStatsUpdate: (operation: "create" | "update" | "delete", lessonId?: string) => Promise<void>;
  slug: string;
  summaryContent: string | null;
  transcriptContent: string | null;
  suppressVideoPlayback?: boolean;
  skipVideoAutoplay?: boolean;
};

export type VideoNavigationState = {
  hasNextLesson: boolean;
  hasNextVideo: boolean;
  hasPreviousVideo: boolean;
  isLastLesson: boolean;
};

export type CurrentTimeRef = MutableRefObject<number>;
