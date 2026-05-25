"use client";

import { useCallback, useEffect, useRef } from "react";

const VIDEO_COMPLETION_TRANSITION_DELAY_MS = 1000;

export function useVideoCompletionDelay(
  lessonId: string | undefined,
  onVideoCompleted: (lessonId: string) => void,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(() => {
    if (!lessonId) return;

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      onVideoCompleted(lessonId);
    }, VIDEO_COMPLETION_TRANSITION_DELAY_MS);
  }, [lessonId, onVideoCompleted]);
}
