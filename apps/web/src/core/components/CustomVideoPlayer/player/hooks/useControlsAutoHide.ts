import { useCallback, useEffect, type MutableRefObject } from 'react';

const AUTO_HIDE_DELAY_MS = 3000;

interface UseControlsAutoHideOptions {
  controlsTimeoutRef: MutableRefObject<number | null>;
  isHovering: boolean;
  isPlaying: boolean;
  seekControlsLocked: boolean;
  setShowControls: (show: boolean) => void;
  setIsHovering: (hovering: boolean) => void;
  setIsDraggingProgress: (dragging: boolean) => void;
}

interface UseControlsAutoHideResult {
  /** Restart the auto-hide countdown — call after any user interaction. */
  resetControlsTimeout: () => void;
}

/**
 * Manages the "auto-hide controls after N seconds of inactivity"
 * behavior.  Also keeps controls visible when the user is hovering,
 * when playback is paused, or when seek controls are locked.
 */
export function useControlsAutoHide({
  controlsTimeoutRef,
  isHovering,
  isPlaying,
  seekControlsLocked,
  setShowControls,
  setIsHovering,
  setIsDraggingProgress,
}: UseControlsAutoHideOptions): UseControlsAutoHideResult {
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current !== null) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
      setIsHovering(false);
    }, AUTO_HIDE_DELAY_MS);
  }, [controlsTimeoutRef, setShowControls, setIsHovering]);

  // Show controls when hovering or paused; restart the timer when playing.
  useEffect(() => {
    if (isHovering || isPlaying) {
      resetControlsTimeout();
    }
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current !== null) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isHovering, isPlaying, resetControlsTimeout, setShowControls, controlsTimeoutRef]);

  // If seek gets locked mid-drag, cancel the drag state.
  useEffect(() => {
    if (seekControlsLocked) {
      setIsDraggingProgress(false);
    }
  }, [seekControlsLocked, setIsDraggingProgress]);

  // Cleanup the timeout on unmount.
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current !== null) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [controlsTimeoutRef]);

  return { resetControlsTimeout };
}
