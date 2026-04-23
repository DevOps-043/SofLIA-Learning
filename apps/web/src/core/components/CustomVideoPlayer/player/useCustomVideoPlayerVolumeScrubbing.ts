import type { RefObject } from 'react';
import { useBarScrubbing } from './useBarScrubbing';
import { calculateVolumeLevel } from './video-player.utils';

interface VolumeScrubbingParams {
  isDraggingVolume: boolean;
  setIsDraggingVolume: (value: boolean) => void;
  setIsMuted: (value: boolean) => void;
  setShowVolumeControl: (value: boolean) => void;
  setVolume: (value: number) => void;
  videoRef: RefObject<HTMLVideoElement>;
  volumeBarRef: RefObject<HTMLDivElement>;
}

export function useCustomVideoPlayerVolumeScrubbing({
  isDraggingVolume,
  setIsDraggingVolume,
  setIsMuted,
  setShowVolumeControl,
  setVolume,
  videoRef,
  volumeBarRef,
}: VolumeScrubbingParams) {
  const updateVolume = (clientY: number) => {
    const videoElement = videoRef.current;
    const volumeBarElement = volumeBarRef.current;
    if (!videoElement || !volumeBarElement) return;

    const rect = volumeBarElement.getBoundingClientRect();
    const nextVolume = calculateVolumeLevel(clientY, rect.bottom, rect.height);
    videoElement.volume = nextVolume;
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  };

  const scrubbing = useBarScrubbing({
    isDragging: isDraggingVolume,
    setIsDragging: setIsDraggingVolume,
    update: updateVolume,
    getMouseCoord: (e) => e.clientY,
    getTouchCoord: (t) => t.clientY,
    onInteractionStart: () => setShowVolumeControl(true),
  });

  return {
    handleVolumeClick: scrubbing.handleClick,
    handleVolumeMouseDown: scrubbing.handleMouseDown,
    handleVolumeMouseMove: scrubbing.handleMouseMove,
    handleVolumeMouseUp: scrubbing.handleMouseUp,
    handleVolumeTouchEnd: scrubbing.handleTouchEnd,
    handleVolumeTouchMove: scrubbing.handleTouchMove,
    handleVolumeTouchStart: scrubbing.handleTouchStart,
    updateVolume,
  };
}
