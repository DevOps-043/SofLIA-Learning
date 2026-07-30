"use client";

import { Play } from "lucide-react";
import { shouldBlockLessonVideoAdvance } from "@/features/courses/hooks/lessonNavigation.utils";
import type { LearnLesson } from "../types";
import type { VideoNavigationState } from "./video-content.types";
import { VideoNavigationOverlay } from "./VideoNavigationOverlay";
import { VideoPlayer } from "./VideoPlayerDynamic";
import styles from "./VideoPanel.module.css";

interface VideoPanelProps {
  enrollmentId?: string | null;
  finishLabel: string;
  handleAdvanceAction: () => void | Promise<void>;
  handleCompletionAction: () => void | Promise<void>;
  handleVideoComplete: () => void;
  lesson: LearnLesson;
  navigationState: VideoNavigationState;
  nextLabel: string;
  onNavigatePrevious: () => void;
  organizationId?: string | null;
  previousLabel: string;
  unavailableLabel: string;
}

export function VideoPanel({
  enrollmentId,
  finishLabel,
  handleAdvanceAction,
  handleCompletionAction,
  handleVideoComplete,
  lesson,
  navigationState,
  nextLabel,
  onNavigatePrevious,
  organizationId,
  previousLabel,
  unavailableLabel,
}: VideoPanelProps) {
  const hasVideo = Boolean(lesson.video_provider && lesson.video_provider_id);
  const primaryAction = navigationState.isLastLesson ? handleCompletionAction : handleAdvanceAction;

  return (
    <div className={styles.stage}>
      {hasVideo ? (
        <div
          data-tour-id="course-learn--video-player"
          className={styles.videoFrame}
        >
          <VideoPlayer
            videoProvider={lesson.video_provider!}
            videoProviderId={lesson.video_provider_id!}
            title={lesson.lesson_title}
            className={styles.player}
            lessonId={lesson.lesson_id}
            enrollmentId={enrollmentId}
            organizationId={organizationId}
            playbackContext="lesson"
            seekControlsLocked={shouldBlockLessonVideoAdvance(lesson)}
            onComplete={handleVideoComplete}
          />
          <VideoNavigationOverlay {...navigationState} finishLabel={finishLabel} nextLabel={nextLabel} onNavigatePrevious={onNavigatePrevious} onPrimaryAction={primaryAction} previousLabel={previousLabel} />
        </div>
      ) : (
        <div
          data-tour-id="course-learn--video-player"
          className={`${styles.videoFrame} ${styles.unavailableFrame}`}
        >
          <div className={styles.unavailableGlow} aria-hidden="true" />
          <div className={styles.unavailableContent}>
            <div className={styles.unavailableIcon}>
              <Play aria-hidden="true" />
            </div>
            <p className={styles.unavailableText}>{unavailableLabel}</p>
          </div>
          <VideoNavigationOverlay {...navigationState} finishLabel={finishLabel} nextLabel={nextLabel} onNavigatePrevious={onNavigatePrevious} onPrimaryAction={primaryAction} previousLabel={previousLabel} />
        </div>
      )}
    </div>
  );
}
