import { useRef } from 'react';

/**
 * DOM and lifecycle refs shared across the player's sub-hooks.
 *
 * Grouped here to keep the orchestrator readable.  Each ref has a
 * single, well-defined consumer hook (videoRef → media events;
 * progressBarRef → progress drag; etc.) but consolidating them avoids
 * threading useRef() calls through multiple files.
 */
export function useVideoRefs() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  // Tracks whether onComplete has already fired for the current src.
  const hasNotifiedCompletionRef = useRef(false);

  // Throttle for timeupdate→React re-renders (max ~4 fps / 250 ms).
  const lastTimeupdateRenderRef = useRef<number>(0);

  // Auto-hide controls timeout handle.
  const controlsTimeoutRef = useRef<number | null>(null);

  return {
    videoRef,
    containerRef,
    progressBarRef,
    volumeBarRef,
    hasNotifiedCompletionRef,
    lastTimeupdateRenderRef,
    controlsTimeoutRef,
  };
}

export type VideoRefs = ReturnType<typeof useVideoRefs>;
