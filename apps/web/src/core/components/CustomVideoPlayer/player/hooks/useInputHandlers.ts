import { useMemo, type MouseEvent, type TouchEvent } from 'react';

interface UseInputHandlersOptions {
  isDraggingProgress: boolean;
  isDraggingVolume: boolean;
  seekControlsLocked: boolean;
  updateProgress: (clientX: number) => void;
  updateVolume: (clientY: number) => void;
  setIsDraggingProgress: (dragging: boolean) => void;
  setIsDraggingVolume: (dragging: boolean) => void;
  setShowControls: (show: boolean) => void;
  setShowVolumeControl: (show: boolean) => void;
}

/**
 * Builds the family of mouse and touch handlers the controls UI binds
 * to its progress bar and volume slider.
 *
 * Each handler is a thin wrapper that:
 *   - guards against the lock state (seekControlsLocked),
 *   - calls preventDefault when needed to suppress mobile-browser gestures,
 *   - delegates the actual seek/volume math to updateProgress / updateVolume,
 *   - syncs the "controls visible" flag so the user sees feedback.
 *
 * Memoized via useMemo so the controller object stays referentially
 * stable across renders that don't change drag state.
 */
export function useInputHandlers({
  isDraggingProgress,
  isDraggingVolume,
  seekControlsLocked,
  updateProgress,
  updateVolume,
  setIsDraggingProgress,
  setIsDraggingVolume,
  setShowControls,
  setShowVolumeControl,
}: UseInputHandlersOptions) {
  return useMemo(() => {
    return {
      handleProgressClick: (event: MouseEvent<HTMLDivElement>) => {
        if (seekControlsLocked) {
          setShowControls(true);
          return;
        }
        if (!isDraggingProgress) {
          updateProgress(event.clientX);
          setShowControls(true);
        }
      },
      handleProgressMouseDown: (event: MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (seekControlsLocked) {
          setShowControls(true);
          return;
        }
        setIsDraggingProgress(true);
        updateProgress(event.clientX);
        setShowControls(true);
      },
      handleProgressMouseMove: (event: MouseEvent<HTMLDivElement>) => {
        if (isDraggingProgress) {
          event.preventDefault();
          updateProgress(event.clientX);
        }
      },
      handleProgressMouseUp: () => setIsDraggingProgress(false),
      handleProgressTouchEnd: () => setIsDraggingProgress(false),
      handleProgressTouchMove: (event: TouchEvent<HTMLDivElement>) => {
        if (!isDraggingProgress) return;
        event.preventDefault();
        const touch = event.touches[0];
        if (touch) updateProgress(touch.clientX);
      },
      handleProgressTouchStart: (event: TouchEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (seekControlsLocked) {
          setShowControls(true);
          return;
        }
        setIsDraggingProgress(true);
        const touch = event.touches[0];
        if (touch) updateProgress(touch.clientX);
        setShowControls(true);
      },
      handleVolumeClick: (event: MouseEvent<HTMLDivElement>) => {
        if (!isDraggingVolume) updateVolume(event.clientY);
      },
      handleVolumeMouseDown: (event: MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingVolume(true);
        updateVolume(event.clientY);
        setShowVolumeControl(true);
      },
      handleVolumeMouseMove: (event: MouseEvent<HTMLDivElement>) => {
        if (isDraggingVolume) {
          event.preventDefault();
          updateVolume(event.clientY);
        }
      },
      handleVolumeMouseUp: () => setIsDraggingVolume(false),
      handleVolumeTouchEnd: () => setIsDraggingVolume(false),
      handleVolumeTouchMove: (event: TouchEvent<HTMLDivElement>) => {
        if (!isDraggingVolume) return;
        event.preventDefault();
        const touch = event.touches[0];
        if (touch) updateVolume(touch.clientY);
      },
      handleVolumeTouchStart: (event: TouchEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingVolume(true);
        const touch = event.touches[0];
        if (touch) updateVolume(touch.clientY);
        setShowVolumeControl(true);
      },
    };
  }, [
    isDraggingProgress,
    isDraggingVolume,
    seekControlsLocked,
    updateProgress,
    updateVolume,
    setIsDraggingProgress,
    setIsDraggingVolume,
    setShowControls,
    setShowVolumeControl,
  ]);
}
