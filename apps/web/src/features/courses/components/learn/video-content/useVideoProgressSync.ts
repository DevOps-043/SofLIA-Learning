"use client";

import { useEffect } from "react";
import type { LearnLesson } from "../types";
import type { CurrentTimeRef, VideoPlayerContextValue } from "./video-content.types";
import { attachVideoPlaybackListeners } from "./video-progress-listeners";
import { restoreVideoProgress } from "./video-progress-restore";
import { scheduleVideoRestore } from "./video-ready";

interface UseVideoProgressSyncParams {
  currentTimeRef: CurrentTimeRef;
  lesson: LearnLesson;
  videoPlayerContext?: VideoPlayerContextValue | null;
}

const findVideoElement = () =>
  document.querySelector(".aspect-video video") as HTMLVideoElement | null;

export function useVideoProgressSync({
  currentTimeRef,
  lesson,
  videoPlayerContext,
}: UseVideoProgressSyncParams) {
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    let isSetup = false;
    let isDisposed = false;
    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let fallbackTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let currentVideoElement: HTMLVideoElement | null = null;

    const setupVideoListeners = () => {
      if (isSetup) return true;

      const videoElement = findVideoElement();
      if (!videoElement) return false;

      currentVideoElement = videoElement;
      isSetup = true;

      if (videoPlayerContext && lesson.lesson_id) {
        scheduleVideoRestore(videoElement, () =>
          restoreVideoProgress({
            context: videoPlayerContext,
            currentTimeRef,
            isDisposed: () => isDisposed,
            lesson,
            videoElement,
          }),
        );
      }

      cleanupFn = attachVideoPlaybackListeners({
        context: videoPlayerContext,
        currentTimeRef,
        lessonId: lesson.lesson_id,
        videoElement,
      });
      return true;
    };

    const found = setupVideoListeners();

    if (!found) {
      retryTimeoutId = setTimeout(() => {
        if (!isSetup) setupVideoListeners();
      }, 500);
      fallbackTimeoutId = setTimeout(() => {
        if (!isSetup) setupVideoListeners();
      }, 1500);
    }

    return () => {
      isDisposed = true;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
      cleanupFn?.();

      const isInPiP = currentVideoElement && document.pictureInPictureElement === currentVideoElement;
      if (currentVideoElement && !currentVideoElement.paused && !isInPiP) {
        currentVideoElement.pause();
      }
    };
  }, [currentTimeRef, lesson, videoPlayerContext]);
}
