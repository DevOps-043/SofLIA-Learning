import { useEffect, type MutableRefObject, type RefObject } from 'react';

interface UseSourceChangeResetOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  hasNotifiedCompletionRef: MutableRefObject<boolean>;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setHasInitialTimeSet: (set: boolean) => void;
}

/**
 * Resets all playback state when the video src changes.
 *
 * Without this, switching to a new video would briefly show the
 * previous playback position, duration label and completion flag
 * before the new metadata loads.  Also clears the "have we already
 * fired onComplete?" guard so the new video can complete properly.
 */
export function useSourceChangeReset({
  videoRef,
  src,
  hasNotifiedCompletionRef,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setIsLoading,
  setIsBuffering,
  setHasInitialTimeSet,
}: UseSourceChangeResetOptions): void {
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setIsBuffering(false);
    setHasInitialTimeSet(false);
    hasNotifiedCompletionRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
}
