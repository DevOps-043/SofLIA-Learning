import { useState } from 'react';

/**
 * Centralizes all primitive useState declarations for the video player.
 *
 * Kept as a single state hook (rather than per-piece) because every
 * orchestrator consumer needs nearly all of these and grouping them
 * here makes the orchestrator dramatically shorter while preserving
 * the simple "one source of truth" mental model.
 */
export function usePlaybackState(initialTime: number, initialPlaybackRate: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(initialPlaybackRate);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [hasInitialTimeSet, setHasInitialTimeSet] = useState(false);

  return {
    isPlaying, setIsPlaying,
    currentTime, setCurrentTime,
    duration, setDuration,
    volume, setVolume,
    isMuted, setIsMuted,
    isFullscreen, setIsFullscreen,
    showControls, setShowControls,
    isHovering, setIsHovering,
    playbackRate, setPlaybackRate,
    showSettings, setShowSettings,
    showVolumeControl, setShowVolumeControl,
    isLoading, setIsLoading,
    isBuffering, setIsBuffering,
    isDraggingProgress, setIsDraggingProgress,
    isDraggingVolume, setIsDraggingVolume,
    isPiP, setIsPiP,
    hasInitialTimeSet, setHasInitialTimeSet,
  };
}

export type PlaybackState = ReturnType<typeof usePlaybackState>;
