import { useCallback, useEffect, useRef } from 'react';

const VIDEO_COMPLETION_TRANSITION_DELAY_MS = 1000;

interface VideoCompletionTransitionParams {
  lessonId?: string | null;
  onVideoCompleted: (lessonId: string) => void;
}

export function useVideoCompletionTransition({
  lessonId,
  onVideoCompleted,
}: VideoCompletionTransitionParams) {
  const completionTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (completionTransitionTimeoutRef.current !== null) {
        clearTimeout(completionTransitionTimeoutRef.current);
      }
    };
  }, []);

  return useCallback(() => {
    if (!lessonId) return;

    if (completionTransitionTimeoutRef.current !== null) {
      clearTimeout(completionTransitionTimeoutRef.current);
    }

    completionTransitionTimeoutRef.current = setTimeout(() => {
      completionTransitionTimeoutRef.current = null;
      onVideoCompleted(lessonId);
    }, VIDEO_COMPLETION_TRANSITION_DELAY_MS);
  }, [lessonId, onVideoCompleted]);
}
