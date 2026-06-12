import { shouldBlockLessonVideoAdvance } from "@/features/courses/hooks/lessonNavigation.utils";
import { ALLOW_NEXT_PROGRAMMATIC_SEEK_EVENT } from "@/core/components/CustomVideoPlayer/player/hooks/useForwardSeekGuard";
import type { LearnLesson } from "../types";
import type { CurrentTimeRef, VideoPlayerContextValue } from "./video-content.types";
import { fetchVideoResumeData } from "./video-resume.service";

interface RestoreVideoProgressParams {
  context: VideoPlayerContextValue;
  currentTimeRef: CurrentTimeRef;
  enrollmentId?: string | null;
  isDisposed: () => boolean;
  lesson: LearnLesson;
  organizationId?: string | null;
  videoElement: HTMLVideoElement;
}

export async function restoreVideoProgress({
  context,
  currentTimeRef,
  enrollmentId,
  isDisposed,
  lesson,
  organizationId,
  videoElement,
}: RestoreVideoProgressParams) {
  if (!lesson.lesson_id) {
    return;
  }

  let resumeCheckpoint = context.getVideoProgress(lesson.lesson_id);
  let resumePlaybackRate = 1;

  if (resumeCheckpoint <= 0 && shouldBlockLessonVideoAdvance(lesson)) {
    const resumeData = await fetchVideoResumeData(lesson.lesson_id, {
      enrollmentId,
      organizationId,
    });
    if (isDisposed()) return;

    resumeCheckpoint = resumeData.checkpointSeconds;
    resumePlaybackRate = resumeData.playbackRate;

    if (resumeCheckpoint > 0) {
      context.saveVideoProgress?.(lesson.lesson_id, resumeCheckpoint);
    }
  }

  if (resumePlaybackRate > 0 && Math.abs(videoElement.playbackRate - resumePlaybackRate) > 0.01) {
    videoElement.playbackRate = resumePlaybackRate;
  }

  if (resumeCheckpoint > 0 && videoElement.currentTime <= 0.5) {
    videoElement.dispatchEvent(
      new CustomEvent(ALLOW_NEXT_PROGRAMMATIC_SEEK_EVENT, {
        detail: { targetTime: resumeCheckpoint },
      }),
    );
    videoElement.currentTime = resumeCheckpoint;
    currentTimeRef.current = resumeCheckpoint;
  }

  context.setShouldAutoPlay(false);
}
