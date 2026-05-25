"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useVideoPlayerOptional } from "@/app/courses/[slug]/learn/VideoPlayerContext";
import { LessonDetailsPanel } from "./video-content/LessonDetailsPanel";
import { VideoPanel } from "./video-content/VideoPanel";
import { useVideoAutoplayGuards } from "./video-content/useVideoAutoplayGuards";
import { useVideoCompletionDelay } from "./video-content/useVideoCompletionDelay";
import { useVideoNavigationActions } from "./video-content/useVideoNavigationActions";
import { useVideoNavigationState } from "./video-content/useVideoNavigationState";
import { useVideoProgressSync } from "./video-content/useVideoProgressSync";
import type { VideoContentProps } from "./video-content/video-content.types";

export function VideoContent({
  activities,
  canCompleteLesson,
  getNextLesson,
  getPreviousLesson,
  hasActivities,
  isSummaryLoading,
  isTranscriptLoading,
  lesson,
  markLessonAsCompleted,
  onCannotComplete,
  onCourseCompleted,
  onNavigateNext,
  onNavigatePrevious,
  onNoteCreated,
  onStatsUpdate,
  onVideoCompleted,
  setActiveTab,
  slug,
  summaryContent,
  suppressVideoPlayback = false,
  transcriptContent,
}: VideoContentProps) {
  const { t } = useTranslation("learn");
  const videoPlayerContext = useVideoPlayerOptional();
  const currentTimeRef = useRef(0);
  const handleVideoComplete = useVideoCompletionDelay(lesson.lesson_id, onVideoCompleted);
  const navigationState = useVideoNavigationState({ getNextLesson, getPreviousLesson });
  const { handleAdvanceAction, handleCompletionAction } = useVideoNavigationActions({
    activities,
    canCompleteLesson,
    hasActivities,
    lesson,
    markLessonAsCompleted,
    onCannotComplete,
    onCourseCompleted,
    onNavigateNext,
    setActiveTab,
  });

  useVideoAutoplayGuards({ lessonId: lesson.lesson_id, suppressVideoPlayback, videoPlayerContext });
  useVideoProgressSync({ currentTimeRef, lesson, videoPlayerContext });

  return (
    <div data-tour-id="course-learn--video-content" className="space-y-6 pb-16 md:pb-6">
      <VideoPanel
        finishLabel={t("navigation.completeCourse")}
        handleAdvanceAction={handleAdvanceAction}
        handleCompletionAction={handleCompletionAction}
        handleVideoComplete={handleVideoComplete}
        lesson={lesson}
        navigationState={navigationState}
        nextLabel={t("navigation.next")}
        onNavigatePrevious={onNavigatePrevious}
        previousLabel={t("navigation.previous")}
        unavailableLabel={t("video.unavailable")}
      />
      <LessonDetailsPanel
        isSummaryLoading={isSummaryLoading}
        isTranscriptLoading={isTranscriptLoading}
        lesson={lesson}
        onNoteCreated={onNoteCreated}
        onStatsUpdate={onStatsUpdate}
        slug={slug}
        summaryContent={summaryContent}
        transcriptContent={transcriptContent}
      />
    </div>
  );
}
