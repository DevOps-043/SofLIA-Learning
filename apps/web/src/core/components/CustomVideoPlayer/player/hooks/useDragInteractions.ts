import { useCallback, useEffect, type RefObject } from 'react';

import { calculateProgressTime, calculateVolumeLevel } from '../video-player.utils';

interface UseDragInteractionsOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  progressBarRef: RefObject<HTMLDivElement | null>;
  volumeBarRef: RefObject<HTMLDivElement | null>;
  duration: number;
  seekControlsLocked: boolean;
  isDraggingProgress: boolean;
  isDraggingVolume: boolean;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setIsDraggingProgress: (dragging: boolean) => void;
  setIsDraggingVolume: (dragging: boolean) => void;
}

interface UseDragInteractionsResult {
  /** Seek to the position under clientX, respecting seekControlsLocked. */
  updateProgress: (clientX: number) => void;
  /** Set volume from a vertical clientY position. */
  updateVolume: (clientY: number) => void;
}

/**
 * Handles progress-bar seeking and volume-slider dragging.
 *
 * Owns two pieces:
 *   - The pure "translate cursor position → currentTime / volume"
 *     helpers, which the controller's mouse/touch handlers call.
 *   - The document-level mousemove/mouseup/mouseleave listeners that
 *     keep dragging working when the cursor leaves the slider element.
 */
export function useDragInteractions({
  videoRef,
  progressBarRef,
  volumeBarRef,
  duration,
  seekControlsLocked,
  isDraggingProgress,
  isDraggingVolume,
  setCurrentTime,
  setVolume,
  setIsMuted,
  setIsDraggingProgress,
  setIsDraggingVolume,
}: UseDragInteractionsOptions): UseDragInteractionsResult {
  const updateProgress = useCallback(
    (clientX: number) => {
      if (seekControlsLocked) return;
      const videoElement = videoRef.current;
      const progressBarElement = progressBarRef.current;
      if (!videoElement || !progressBarElement || duration === 0) return;

      const rect = progressBarElement.getBoundingClientRect();
      const nextTime = calculateProgressTime(clientX, rect.left, rect.width, duration);
      videoElement.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration, seekControlsLocked, videoRef, progressBarRef, setCurrentTime],
  );

  const updateVolume = useCallback(
    (clientY: number) => {
      const videoElement = videoRef.current;
      const volumeBarElement = volumeBarRef.current;
      if (!videoElement || !volumeBarElement) return;

      const rect = volumeBarElement.getBoundingClientRect();
      const nextVolume = calculateVolumeLevel(clientY, rect.bottom, rect.height);
      videoElement.volume = nextVolume;
      setVolume(nextVolume);
      setIsMuted(nextVolume === 0);
    },
    [videoRef, volumeBarRef, setVolume, setIsMuted],
  );

  // Document-level listeners so dragging keeps working when the
  // cursor exits the slider element.
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingProgress) {
        event.preventDefault();
        updateProgress(event.clientX);
      }
      if (isDraggingVolume) {
        event.preventDefault();
        updateVolume(event.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [
    isDraggingProgress,
    isDraggingVolume,
    updateProgress,
    updateVolume,
    setIsDraggingProgress,
    setIsDraggingVolume,
  ]);

  return { updateProgress, updateVolume };
}
