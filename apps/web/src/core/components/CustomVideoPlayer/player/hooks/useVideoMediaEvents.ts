import { useEffect, type MutableRefObject, type RefObject } from 'react';

import {
  NATIVE_VIDEO_BUFFERING_DELAY_MS,
  NATIVE_VIDEO_STALLED_DELAY_MS,
  hasNativeVideoPlayableData,
  isNativeVideoWaitingForPlayableData,
} from '@/lib/media';

const VIDEO_COMPLETION_EPSILON_SECONDS = 0.25;
const VIDEO_COMPLETION_PROGRESS_THRESHOLD = 0.995;
const TIMEUPDATE_RENDER_THROTTLE_MS = 250;

interface UseVideoMediaEventsOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  duration: number;
  initialTime: number;
  initialPlaybackRate: number;
  hasInitialTimeSet: boolean;
  hasNotifiedCompletionRef: MutableRefObject<boolean>;
  lastTimeupdateRenderRef: MutableRefObject<number>;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setHasInitialTimeSet: (set: boolean) => void;
}

/**
 * Subscribes to all native HTMLMediaElement events the player cares
 * about and bridges them to React state.
 *
 * Handles three orthogonal concerns:
 *   - Buffering indicator with debounced delays (don't flash a spinner
 *     on Safari's transient stalled/waiting events).
 *   - Completion detection (notifies onComplete once when the video
 *     reaches the end, even if the natural 'ended' event is missed).
 *   - Throttled state updates (timeupdate fires ~4 Hz natively; without
 *     throttling each fire would trigger a full React re-render and
 *     overheat mobile CPUs).
 */
export function useVideoMediaEvents({
  videoRef,
  duration,
  initialTime,
  initialPlaybackRate,
  hasInitialTimeSet,
  hasNotifiedCompletionRef,
  lastTimeupdateRenderRef,
  onComplete,
  onProgress,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setIsLoading,
  setIsBuffering,
  setHasInitialTimeSet,
}: UseVideoMediaEventsOptions): void {
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let bufferingIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearBufferingTimeout = () => {
      if (bufferingIndicatorTimeout) {
        clearTimeout(bufferingIndicatorTimeout);
        bufferingIndicatorTimeout = null;
      }
    };

    const markVideoResponsive = () => {
      clearBufferingTimeout();
      setIsBuffering(false);
      setIsLoading(false);
    };

    const scheduleBufferingIndicator = (delayMs: number) => {
      clearBufferingTimeout();
      bufferingIndicatorTimeout = setTimeout(() => {
        bufferingIndicatorTimeout = null;
        if (isNativeVideoWaitingForPlayableData(videoElement)) {
          setIsBuffering(true);
        }
      }, delayMs);
    };

    const notifyCompletion = () => {
      if (hasNotifiedCompletionRef.current) return;
      hasNotifiedCompletionRef.current = true;
      onComplete?.();
    };

    const updateTime = () => {
      const playbackTime = videoElement.currentTime;
      markVideoResponsive();

      // Completion check runs every timeupdate (no throttle).
      if (duration > 0 && !videoElement.paused && !videoElement.ended) {
        const remainingTime = duration - playbackTime;
        const progressRatio = playbackTime / duration;
        if (
          remainingTime <= VIDEO_COMPLETION_EPSILON_SECONDS ||
          progressRatio >= VIDEO_COMPLETION_PROGRESS_THRESHOLD
        ) {
          notifyCompletion();
        }
      }

      // React state update is throttled to avoid mobile CPU heat.
      const now = performance.now();
      if (now - lastTimeupdateRenderRef.current < TIMEUPDATE_RENDER_THROTTLE_MS) return;
      lastTimeupdateRenderRef.current = now;

      setCurrentTime(playbackTime);
      if (onProgress && duration > 0) {
        onProgress((playbackTime / duration) * 100);
      }
    };

    const applyInitialSettings = () => {
      if (!hasInitialTimeSet && initialTime > 0) {
        videoElement.currentTime = initialTime;
        setHasInitialTimeSet(true);
      }
      if (Math.abs(videoElement.playbackRate - initialPlaybackRate) > 0.01) {
        videoElement.playbackRate = initialPlaybackRate;
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      applyInitialSettings();
    };

    const handleEnded = () => {
      markVideoResponsive();
      setIsPlaying(false);
      notifyCompletion();
    };

    // Safari can emit 'stalled' during normal bandwidth management.
    // Avoid synthetic seeks here: they wake the decoder and heat iOS.
    const handleWaiting = () => scheduleBufferingIndicator(NATIVE_VIDEO_BUFFERING_DELAY_MS);
    const handleStalled = () => scheduleBufferingIndicator(NATIVE_VIDEO_STALLED_DELAY_MS);

    const handleCanPlay = () => {
      markVideoResponsive();
      applyInitialSettings();
    };

    const handlePlaying = () => {
      markVideoResponsive();
      setIsPlaying(true);
    };

    const handleProgress = () => {
      if (hasNativeVideoPlayableData(videoElement)) markVideoResponsive();
    };

    const handleNativePlay = () => {
      setIsPlaying(true);
      if (hasNativeVideoPlayableData(videoElement)) {
        markVideoResponsive();
        return;
      }
      scheduleBufferingIndicator(NATIVE_VIDEO_BUFFERING_DELAY_MS);
    };

    const handleNativePause = () => {
      clearBufferingTimeout();
      setIsBuffering(false);
      setIsPlaying(false);
    };

    videoElement.addEventListener('timeupdate', updateTime);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('loadeddata', markVideoResponsive);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('stalled', handleStalled);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('canplaythrough', markVideoResponsive);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('seeked', handleProgress);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('play', handleNativePlay);
    videoElement.addEventListener('pause', handleNativePause);

    return () => {
      clearBufferingTimeout();
      videoElement.removeEventListener('timeupdate', updateTime);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('loadeddata', markVideoResponsive);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('stalled', handleStalled);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('canplaythrough', markVideoResponsive);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('seeked', handleProgress);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('play', handleNativePlay);
      videoElement.removeEventListener('pause', handleNativePause);
    };
  }, [
    duration,
    hasInitialTimeSet,
    initialPlaybackRate,
    initialTime,
    onComplete,
    onProgress,
    videoRef,
    hasNotifiedCompletionRef,
    lastTimeupdateRenderRef,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setIsLoading,
    setIsBuffering,
    setHasInitialTimeSet,
  ]);
}
