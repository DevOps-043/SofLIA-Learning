import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { isNativeVideoWaitingForPlayableData } from '@/lib/media';

export function useBufferingIndicator(
  videoRef: RefObject<HTMLVideoElement>,
  setIsBuffering: (value: boolean) => void,
) {
  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBufferingTimeout = useCallback(() => {
    if (!bufferingTimeoutRef.current) return;
    clearTimeout(bufferingTimeoutRef.current);
    bufferingTimeoutRef.current = null;
  }, []);

  const markVideoResponsive = useCallback(() => {
    clearBufferingTimeout();
    setIsBuffering(false);
  }, [clearBufferingTimeout, setIsBuffering]);

  const scheduleBufferingIndicator = useCallback(
    (delayMs: number) => {
      clearBufferingTimeout();
      bufferingTimeoutRef.current = setTimeout(() => {
        bufferingTimeoutRef.current = null;
        if (isNativeVideoWaitingForPlayableData(videoRef.current)) setIsBuffering(true);
      }, delayMs);
    },
    [clearBufferingTimeout, setIsBuffering, videoRef],
  );

  useEffect(() => clearBufferingTimeout, [clearBufferingTimeout]);

  return { clearBufferingTimeout, markVideoResponsive, scheduleBufferingIndicator };
}
