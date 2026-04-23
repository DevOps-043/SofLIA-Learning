import type { RefObject } from 'react';
import { useBarScrubbing } from './useBarScrubbing';
import { calculateProgressTime } from './video-player.utils';

interface ProgressScrubbingParams {
  duration: number;
  isDraggingProgress: boolean;
  progressBarRef: RefObject<HTMLDivElement>;
  setCurrentTime: (value: number) => void;
  setIsDraggingProgress: (value: boolean) => void;
  setShowControls: (value: boolean) => void;
  videoRef: RefObject<HTMLVideoElement>;
}

export function useCustomVideoPlayerProgressScrubbing({
  duration,
  isDraggingProgress,
  progressBarRef,
  setCurrentTime,
  setIsDraggingProgress,
  setShowControls,
  videoRef,
}: ProgressScrubbingParams) {
  const updateProgress = (clientX: number) => {
    const videoElement = videoRef.current;
    const progressBarElement = progressBarRef.current;
    if (!videoElement || !progressBarElement || duration === 0) return;

    const rect = progressBarElement.getBoundingClientRect();
    const nextTime = calculateProgressTime(clientX, rect.left, rect.width, duration);
    videoElement.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const scrubbing = useBarScrubbing({
    isDragging: isDraggingProgress,
    setIsDragging: setIsDraggingProgress,
    update: updateProgress,
    getMouseCoord: (e) => e.clientX,
    getTouchCoord: (t) => t.clientX,
    onInteractionStart: () => setShowControls(true),
  });

  return {
    handleProgressClick: scrubbing.handleClick,
    handleProgressMouseDown: scrubbing.handleMouseDown,
    handleProgressMouseMove: scrubbing.handleMouseMove,
    handleProgressMouseUp: scrubbing.handleMouseUp,
    handleProgressTouchEnd: scrubbing.handleTouchEnd,
    handleProgressTouchMove: scrubbing.handleTouchMove,
    handleProgressTouchStart: scrubbing.handleTouchStart,
    updateProgress,
  };
}
