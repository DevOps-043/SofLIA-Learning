import { useEffect, useRef, type RefObject } from 'react';

import {
  clampLockedSeekTarget,
  isForwardSeekBlocked,
} from '../video-player.utils';

export const ALLOW_NEXT_PROGRAMMATIC_SEEK_EVENT = 'soflia:allow-next-programmatic-seek';

interface UseForwardSeekGuardOptions {
  duration: number;
  seekControlsLocked: boolean;
  setCurrentTime: (time: number) => void;
  src: string;
  videoRef: RefObject<HTMLVideoElement | null>;
}

type TrustedSeekEvent = CustomEvent<{ targetTime?: number }>;

export function useForwardSeekGuard({
  duration,
  seekControlsLocked,
  setCurrentTime,
  src,
  videoRef,
}: UseForwardSeekGuardOptions): void {
  const maxAllowedTimeRef = useRef(0);
  const trustedSeekTargetRef = useRef<number | null>(null);
  const isRevertingRef = useRef(false);

  useEffect(() => {
    maxAllowedTimeRef.current = 0;
    trustedSeekTargetRef.current = null;
    isRevertingRef.current = false;
  }, [src]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!seekControlsLocked) {
      maxAllowedTimeRef.current = Math.max(
        maxAllowedTimeRef.current,
        videoElement.currentTime || 0,
      );
      return;
    }

    const rememberWatchedTime = () => {
      if (isRevertingRef.current) return;
      maxAllowedTimeRef.current = Math.max(
        maxAllowedTimeRef.current,
        videoElement.currentTime || 0,
      );
    };

    const allowNextProgrammaticSeek = (event: Event) => {
      const customEvent = event as TrustedSeekEvent;
      trustedSeekTargetRef.current =
        typeof customEvent.detail?.targetTime === 'number'
          ? customEvent.detail.targetTime
          : videoElement.currentTime;
    };

    const enforceSeekLimit = () => {
      if (!seekControlsLocked || isRevertingRef.current) return;

      const requestedTime = videoElement.currentTime || 0;
      const trustedTarget = trustedSeekTargetRef.current;

      if (
        trustedTarget !== null &&
        Math.abs(requestedTime - trustedTarget) <= 1
      ) {
        maxAllowedTimeRef.current = Math.max(maxAllowedTimeRef.current, requestedTime);
        trustedSeekTargetRef.current = null;
        return;
      }

      trustedSeekTargetRef.current = null;

      if (!isForwardSeekBlocked(requestedTime, maxAllowedTimeRef.current)) {
        rememberWatchedTime();
        return;
      }

      const safeTime = clampLockedSeekTarget(
        requestedTime,
        maxAllowedTimeRef.current,
        duration,
      );

      isRevertingRef.current = true;
      videoElement.currentTime = safeTime;
      setCurrentTime(safeTime);
      window.setTimeout(() => {
        isRevertingRef.current = false;
      }, 0);
    };

    maxAllowedTimeRef.current = Math.max(
      maxAllowedTimeRef.current,
      Math.min(videoElement.currentTime || 0, duration > 0 ? duration : Number.POSITIVE_INFINITY),
    );

    videoElement.addEventListener('timeupdate', rememberWatchedTime);
    videoElement.addEventListener('seeking', enforceSeekLimit);
    videoElement.addEventListener('seeked', enforceSeekLimit);
    videoElement.addEventListener(
      ALLOW_NEXT_PROGRAMMATIC_SEEK_EVENT,
      allowNextProgrammaticSeek,
    );

    return () => {
      videoElement.removeEventListener('timeupdate', rememberWatchedTime);
      videoElement.removeEventListener('seeking', enforceSeekLimit);
      videoElement.removeEventListener('seeked', enforceSeekLimit);
      videoElement.removeEventListener(
        ALLOW_NEXT_PROGRAMMATIC_SEEK_EVENT,
        allowNextProgrammaticSeek,
      );
    };
  }, [duration, seekControlsLocked, setCurrentTime, src, videoRef]);
}
