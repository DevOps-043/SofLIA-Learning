import { useEffect } from 'react';
import { useVideoPlayerOptional } from '@/app/courses/[slug]/learn/VideoPlayerContext';
import type { LearnLesson } from '../types';
import { restoreVideoPlaybackProgress } from './video-playback-restore.service';

interface LessonVideoPlaybackBridgeParams {
  lesson: LearnLesson;
  suppressVideoPlayback: boolean;
}

const findVideoElement = () =>
  document.querySelector('.aspect-video video') as HTMLVideoElement | null;

export function useLessonVideoPlaybackBridge({
  lesson,
  suppressVideoPlayback,
}: LessonVideoPlaybackBridgeParams) {
  const videoContext = useVideoPlayerOptional();
  const setShouldAutoPlay = videoContext?.setShouldAutoPlay;
  const pauseAllVideos = videoContext?.pauseAllVideos;

  useEffect(() => {
    setShouldAutoPlay?.(false);
  }, [lesson.lesson_id, setShouldAutoPlay]);

  useEffect(() => {
    if (!suppressVideoPlayback) return;
    setShouldAutoPlay?.(false);
    pauseAllVideos?.();
  }, [pauseAllVideos, setShouldAutoPlay, suppressVideoPlayback]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    let isDisposed = false;
    let isSetup = false;
    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let currentVideoElement: HTMLVideoElement | null = null;

    const setupVideoListeners = () => {
      if (isSetup) return true;
      const videoElement = findVideoElement();
      if (!videoElement) return false;

      currentVideoElement = videoElement;
      isSetup = true;

      if (videoContext && lesson.lesson_id) {
        const restore = () => restoreVideoPlaybackProgress({
          isDisposed: () => isDisposed,
          lesson,
          videoContext,
          videoElement,
        });
        if (videoElement.readyState >= 3) void restore();
        else videoElement.addEventListener('canplay', () => void restore(), { once: true });
      }

      const saveProgress = () => {
        if (lesson.lesson_id) {
          videoContext?.saveVideoProgress?.(lesson.lesson_id, videoElement.currentTime);
        }
      };
      const onPlay = () => videoContext?.setIsVideoPlaying(true);
      const onPause = () => {
        videoContext?.setIsVideoPlaying(false);
        saveProgress();
      };
      const onEnterPiP = () => videoContext?.setIsPiPActive(true);
      const onLeavePiP = () => videoContext?.setIsPiPActive(false);

      videoElement.addEventListener('play', onPlay);
      videoElement.addEventListener('pause', onPause);
      videoElement.addEventListener('ended', onPause);
      videoElement.addEventListener('enterpictureinpicture', onEnterPiP);
      videoElement.addEventListener('leavepictureinpicture', onLeavePiP);
      if (!videoElement.paused) videoContext?.setIsVideoPlaying(true);

      cleanupFn = () => {
        videoElement.removeEventListener('play', onPlay);
        videoElement.removeEventListener('pause', onPause);
        videoElement.removeEventListener('ended', onPause);
        videoElement.removeEventListener('enterpictureinpicture', onEnterPiP);
        videoElement.removeEventListener('leavepictureinpicture', onLeavePiP);
        saveProgress();
        const isInPiP = document.pictureInPictureElement === videoElement;
        if (!videoElement.paused && !isInPiP) videoElement.pause();
      };

      return true;
    };

    if (!setupVideoListeners()) {
      retryTimeoutId = setTimeout(() => setupVideoListeners(), 500);
    }

    return () => {
      isDisposed = true;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      cleanupFn?.();
      const isInPiP = currentVideoElement && document.pictureInPictureElement === currentVideoElement;
      if (currentVideoElement && !currentVideoElement.paused && !isInPiP) currentVideoElement.pause();
    };
    // Keep listener lifecycle tied to the lesson identity, not progress state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.lesson_id]);
}
