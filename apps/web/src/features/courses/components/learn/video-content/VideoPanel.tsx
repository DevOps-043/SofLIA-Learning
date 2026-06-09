"use client";

import { Play } from "lucide-react";
import { shouldBlockLessonVideoAdvance } from "@/features/courses/hooks/lessonNavigation.utils";
import type { LearnLesson } from "../types";
import type { VideoNavigationState } from "./video-content.types";
import { VideoNavigationOverlay } from "./VideoNavigationOverlay";
import { VideoPlayer } from "./VideoPlayerDynamic";

interface VideoPanelProps {
  finishLabel: string;
  handleAdvanceAction: () => void | Promise<void>;
  handleCompletionAction: () => void | Promise<void>;
  handleVideoComplete: () => void;
  lesson: LearnLesson;
  navigationState: VideoNavigationState;
  nextLabel: string;
  onNavigatePrevious: () => void;
  previousLabel: string;
  unavailableLabel: string;
}

export function VideoPanel({
  finishLabel,
  handleAdvanceAction,
  handleCompletionAction,
  handleVideoComplete,
  lesson,
  navigationState,
  nextLabel,
  onNavigatePrevious,
  previousLabel,
  unavailableLabel,
}: VideoPanelProps) {
  const hasVideo = Boolean(lesson.video_provider && lesson.video_provider_id);
  const primaryAction = navigationState.isLastLesson ? handleCompletionAction : handleAdvanceAction;

  return (
    <div className="relative w-full">
      {hasVideo ? (
        <div data-tour-id="course-learn--video-player" className="aspect-video w-full max-h-[calc(100dvh-13rem)] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-500/30 relative bg-gray-900">
          <VideoPlayer
            videoProvider={lesson.video_provider!}
            videoProviderId={lesson.video_provider_id!}
            title={lesson.lesson_title}
            className="w-full h-full"
            lessonId={lesson.lesson_id}
            playbackContext="lesson"
            seekControlsLocked={shouldBlockLessonVideoAdvance(lesson)}
            onComplete={handleVideoComplete}
          />
          <VideoNavigationOverlay {...navigationState} finishLabel={finishLabel} nextLabel={nextLabel} onNavigatePrevious={onNavigatePrevious} onPrimaryAction={primaryAction} previousLabel={previousLabel} />
        </div>
      ) : (
        <div data-tour-id="course-learn--video-player" className="aspect-video w-full max-h-[calc(100dvh-13rem)] bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-500/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-accent/10 animate-pulse" />
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-primary/90 transition-all transform group-hover:scale-110">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
            <p className="text-gray-700 dark:text-white/70">{unavailableLabel}</p>
          </div>
          <VideoNavigationOverlay {...navigationState} finishLabel={finishLabel} nextLabel={nextLabel} onNavigatePrevious={onNavigatePrevious} onPrimaryAction={primaryAction} previousLabel={previousLabel} />
        </div>
      )}
    </div>
  );
}
