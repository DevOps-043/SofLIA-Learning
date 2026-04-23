import type { MouseEvent, TouchEvent } from 'react';

interface BarScrubbingParams {
  /** Whether the user is currently dragging the bar. */
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  /** Applies the computed value to the underlying media property (time or volume). */
  update: (coord: number) => void;
  /** Extracts the relevant coordinate from a mouse event (clientX or clientY). */
  getMouseCoord: (event: MouseEvent<HTMLDivElement>) => number;
  /** Extracts the relevant coordinate from a touch point (clientX or clientY). */
  getTouchCoord: (touch: Touch) => number;
  /** Called on interaction start (e.g. show controls overlay). Optional. */
  onInteractionStart?: () => void;
}

/**
 * Generic pointer-scrubbing hook for range controls (progress bar, volume bar).
 *
 * Handles mouse and touch events with consistent drag semantics.
 * Both `useCustomVideoPlayerProgressScrubbing` and `useCustomVideoPlayerVolumeScrubbing`
 * delegate to this hook — they only differ in axis (X vs Y) and the `update` function.
 */
export function useBarScrubbing({
  isDragging,
  setIsDragging,
  update,
  getMouseCoord,
  getTouchCoord,
  onInteractionStart,
}: BarScrubbingParams) {
  return {
    handleClick: (event: MouseEvent<HTMLDivElement>) => {
      if (!isDragging) {
        update(getMouseCoord(event));
        onInteractionStart?.();
      }
    },
    handleMouseDown: (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(true);
      update(getMouseCoord(event));
      onInteractionStart?.();
    },
    handleMouseMove: (event: MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      event.preventDefault();
      update(getMouseCoord(event));
    },
    handleMouseUp: () => setIsDragging(false),
    handleTouchEnd: () => setIsDragging(false),
    handleTouchMove: (event: TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      event.preventDefault();
      const touch = event.touches[0];
      if (touch) update(getTouchCoord(touch));
    },
    handleTouchStart: (event: TouchEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(true);
      const touch = event.touches[0];
      if (touch) update(getTouchCoord(touch));
      onInteractionStart?.();
    },
  };
}
