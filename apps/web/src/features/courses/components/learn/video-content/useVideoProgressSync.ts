"use client";

import { useEffect, useRef } from "react";
import type { LearnLesson } from "../types";
import type { CurrentTimeRef, VideoPlayerContextValue } from "./video-content.types";
import { attachVideoPlaybackListeners } from "./video-progress-listeners";
import { restoreVideoProgress } from "./video-progress-restore";
import { scheduleVideoRestore } from "./video-ready";

interface UseVideoProgressSyncParams {
  currentTimeRef: CurrentTimeRef;
  enrollmentId?: string | null;
  lesson: LearnLesson;
  organizationId?: string | null;
  videoPlayerContext?: VideoPlayerContextValue | null;
}

const findVideoElement = () =>
  document.querySelector(".aspect-video video") as HTMLVideoElement | null;

export function useVideoProgressSync({
  currentTimeRef,
  enrollmentId,
  lesson,
  organizationId,
  videoPlayerContext,
}: UseVideoProgressSyncParams) {
  const videoPlayerContextRef = useRef(videoPlayerContext);
  videoPlayerContextRef.current = videoPlayerContext;

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

      if (lesson.lesson_id) {
        scheduleVideoRestore(videoElement, () => {
          const context = videoPlayerContextRef.current;
          if (!context) return Promise.resolve();

          return restoreVideoProgress({
            context,
            currentTimeRef,
            enrollmentId,
            isDisposed: () => isDisposed,
            lesson,
            organizationId,
            videoElement,
          });
        });
      }

      cleanupFn = attachVideoPlaybackListeners({
        currentTimeRef,
        getContext: () => videoPlayerContextRef.current,
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
  }, [currentTimeRef, enrollmentId, lesson, organizationId]);
}
