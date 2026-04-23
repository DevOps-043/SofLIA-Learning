import type { useVideoPlayerOptional } from '@/app/courses/[slug]/learn/VideoPlayerContext';
import { isLessonVideoCompleted } from '@/features/courses/hooks/lessonNavigation.utils';
import type { LearnLesson } from '../types';
import { fetchVideoResumeData } from './video-resume.service';

type VideoContextValue = NonNullable<ReturnType<typeof useVideoPlayerOptional>>;

interface RestoreVideoPlaybackParams {
  isDisposed: () => boolean;
  lesson: LearnLesson;
  videoContext: VideoContextValue;
  videoElement: HTMLVideoElement;
}

export async function restoreVideoPlaybackProgress({
  isDisposed,
  lesson,
  videoContext,
  videoElement,
}: RestoreVideoPlaybackParams) {
  if (!lesson.lesson_id) return;

  const cachedTime = videoContext.getVideoProgress(lesson.lesson_id);
  let resumeCheckpoint = cachedTime;
  let resumePlaybackRate = 1;

  if (resumeCheckpoint <= 0 && !isLessonVideoCompleted(lesson)) {
    const resumeData = await fetchVideoResumeData(lesson.lesson_id);
    if (isDisposed()) return;

    resumeCheckpoint = resumeData.checkpointSeconds;
    resumePlaybackRate = resumeData.playbackRate;

    if (resumeCheckpoint > 0) {
      videoContext.saveVideoProgress?.(lesson.lesson_id, resumeCheckpoint);
    }
  }

  if (
    resumePlaybackRate > 0 &&
    Math.abs(videoElement.playbackRate - resumePlaybackRate) > 0.01
  ) {
    videoElement.playbackRate = resumePlaybackRate;
  }

  if (resumeCheckpoint > 0 && videoElement.currentTime <= 0.5) {
    videoElement.currentTime = resumeCheckpoint;
  }

  videoContext.setShouldAutoPlay(false);
}
