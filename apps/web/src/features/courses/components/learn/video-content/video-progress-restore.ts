import { shouldBlockLessonVideoAdvance } from "@/features/courses/hooks/lessonNavigation.utils";
import type { LearnLesson } from "../types";
import type { CurrentTimeRef, VideoPlayerContextValue } from "./video-content.types";
import { fetchVideoResumeData } from "./video-resume.service";

interface RestoreVideoProgressParams {
  context: VideoPlayerContextValue;
  currentTimeRef: CurrentTimeRef;
  isDisposed: () => boolean;
  lesson: LearnLesson;
  videoElement: HTMLVideoElement;
}

export async function restoreVideoProgress({
  context,
  currentTimeRef,
  isDisposed,
  lesson,
  videoElement,
}: RestoreVideoProgressParams) {
  if (!lesson.lesson_id) {
    return;
  }

  let resumeCheckpoint = context.getVideoProgress(lesson.lesson_id);
  let resumePlaybackRate = 1;

  if (resumeCheckpoint <= 0 && shouldBlockLessonVideoAdvance(lesson)) {
    const resumeData = await fetchVideoResumeData(lesson.lesson_id);
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
    videoElement.currentTime = resumeCheckpoint;
    currentTimeRef.current = resumeCheckpoint;
  }

  context.setShouldAutoPlay(false);
}
