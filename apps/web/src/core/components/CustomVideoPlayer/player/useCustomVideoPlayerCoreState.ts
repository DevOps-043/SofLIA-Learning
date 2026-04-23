import { useRef, useState } from 'react';

interface CoreStateParams {
  initialPlaybackRate: number;
  initialTime: number;
}

export function useCustomVideoPlayerCoreState({
  initialPlaybackRate,
  initialTime,
}: CoreStateParams) {
  // --- DOM refs (not state — mutations don't trigger re-renders) ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  // Completion ref: prevents duplicate onComplete calls on the same play-through.
  const hasNotifiedCompletionRef = useRef(false);
  // Throttle ref: last timestamp when React state was updated from timeupdate event.
  const lastTimeupdateRenderRef = useRef<number>(0);

  // --- Playback state ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(initialPlaybackRate);
  const [hasInitialTimeSet, setHasInitialTimeSet] = useState(false);

  // --- Volume state ---
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // --- Loading / buffering state ---
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // --- UI visibility state ---
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  // --- Interaction / drag state ---
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // --- Display mode state ---
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);

  return {
    containerRef,
    currentTime,
    duration,
    hasInitialTimeSet,
    hasNotifiedCompletionRef,
    isBuffering,
    isDraggingProgress,
    isDraggingVolume,
    isFullscreen,
    isHovering,
    isLoading,
    isMuted,
    isPiP,
    isPlaying,
    lastTimeupdateRenderRef,
    playbackRate,
    progressBarRef,
    setCurrentTime,
    setDuration,
    setHasInitialTimeSet,
    setIsBuffering,
    setIsDraggingProgress,
    setIsDraggingVolume,
    setIsFullscreen,
    setIsHovering,
    setIsLoading,
    setIsMuted,
    setIsPiP,
    setIsPlaying,
    setPlaybackRate,
    setShowControls,
    setShowSettings,
    setShowVolumeControl,
    setVolume,
    showControls,
    showSettings,
    showVolumeControl,
    videoRef,
    volume,
    volumeBarRef,
  };
}

export type CustomVideoPlayerCoreState = ReturnType<
  typeof useCustomVideoPlayerCoreState
>;
