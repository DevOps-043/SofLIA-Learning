import type { NativeVideoEventsParams } from './native-events.types';

// Triggers completion when ≤0.25s remain. Some browsers skip the `ended`
// event on network stalls or codec edge cases; this epsilon catches those.
const VIDEO_COMPLETION_EPSILON_SECONDS = 0.25;

// Triggers completion at 99.5% progress. Catches near-end state before
// the `ended` event fires, preventing missed completions on seek-past-end.
const VIDEO_COMPLETION_PROGRESS_THRESHOLD = 0.995;

// Throttles React state updates: browsers fire `timeupdate` ~4× per second
// but we only need to re-render every 250 ms to keep the progress bar smooth.
const TIMEUPDATE_RENDER_INTERVAL_MS = 250;

export function createCustomVideoNativeHandlers(
  videoElement: HTMLVideoElement,
  params: NativeVideoEventsParams
) {
  let bufferingTimeout: ReturnType<typeof setTimeout> | null = null;

  const clearBufferingTimeout = () => {
    if (!bufferingTimeout) return;
    clearTimeout(bufferingTimeout);
    bufferingTimeout = null;
  };

  const notifyCompletion = () => {
    if (params.hasNotifiedCompletionRef.current) return;
    params.hasNotifiedCompletionRef.current = true;
    params.onComplete?.();
  };

  const applyInitialPlaybackState = () => {
    if (!params.hasInitialTimeSet && params.initialTime > 0) {
      videoElement.currentTime = params.initialTime;
      params.setHasInitialTimeSet(true);
    }

    if (Math.abs(videoElement.playbackRate - params.initialPlaybackRate) > 0.01) {
      videoElement.playbackRate = params.initialPlaybackRate;
    }
  };

  const updateTime = () => {
    const playbackTime = videoElement.currentTime;

    if (params.duration > 0 && !videoElement.paused && !videoElement.ended) {
      const remainingTime = params.duration - playbackTime;
      const progressRatio = playbackTime / params.duration;
      if (
        remainingTime <= VIDEO_COMPLETION_EPSILON_SECONDS ||
        progressRatio >= VIDEO_COMPLETION_PROGRESS_THRESHOLD
      ) {
        notifyCompletion();
      }
    }

    const now = performance.now();
    if (now - params.lastTimeupdateRenderRef.current < TIMEUPDATE_RENDER_INTERVAL_MS) {
      return;
    }

    params.lastTimeupdateRenderRef.current = now;
    params.setCurrentTime(playbackTime);
    if (params.onProgress && params.duration > 0) {
      params.onProgress((playbackTime / params.duration) * 100);
    }
  };

  const handlers = {
    canplay: () => {
      clearBufferingTimeout();
      params.setIsBuffering(false);
      params.setIsLoading(false);
      applyInitialPlaybackState();
    },
    ended: () => {
      params.setIsPlaying(false);
      notifyCompletion();
    },
    loadedmetadata: () => {
      params.setDuration(videoElement.duration);
      applyInitialPlaybackState();
    },
    pause: () => params.setIsPlaying(false),
    play: () => params.setIsPlaying(true),
    playing: () => {
      clearBufferingTimeout();
      params.setIsBuffering(false);
    },
    stalled: () => {
      clearBufferingTimeout();
      bufferingTimeout = setTimeout(() => params.setIsBuffering(true), 500);
    },
    timeupdate: updateTime,
    waiting: () => {
      clearBufferingTimeout();
      bufferingTimeout = setTimeout(() => params.setIsBuffering(true), 300);
    },
  };

  const entries = Object.entries(handlers) as Array<[string, EventListener]>;

  return {
    attach: () => entries.forEach(([event, handler]) => videoElement.addEventListener(event, handler)),
    detach: () => {
      clearBufferingTimeout();
      entries.forEach(([event, handler]) => videoElement.removeEventListener(event, handler));
    },
  };
}
