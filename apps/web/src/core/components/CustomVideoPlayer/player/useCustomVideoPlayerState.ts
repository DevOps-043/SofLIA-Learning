import { type ForwardedRef } from 'react';

import { useCustomVideoPlayerImperativeHandle } from './useCustomVideoPlayerImperativeHandle';
import { useCustomVideoPlayerTracking } from './useCustomVideoPlayerTracking';
import { formatVideoTime, VIDEO_PLAYBACK_RATES } from './video-player.utils';
import type {
  CustomVideoPlayerController,
  CustomVideoPlayerProps,
  CustomVideoPlayerRef,
} from './types';

import { useControlsAutoHide } from './hooks/useControlsAutoHide';
import { useDragInteractions } from './hooks/useDragInteractions';
import { useFullscreenSync } from './hooks/useFullscreenSync';
import { useForwardSeekGuard } from './hooks/useForwardSeekGuard';
import { useInputHandlers } from './hooks/useInputHandlers';
import { usePlaybackState } from './hooks/usePlaybackState';
import { useSourceChangeReset } from './hooks/useSourceChangeReset';
import { useVideoActions } from './hooks/useVideoActions';
import { useVideoAutoPause } from './hooks/useVideoAutoPause';
import { useVideoMediaEvents } from './hooks/useVideoMediaEvents';
import { useVideoPictureInPicture } from './hooks/useVideoPictureInPicture';
import { useVideoRefs } from './hooks/useVideoRefs';

/**
 * Orchestrates the video player state by composing focused sub-hooks.
 *
 * Each sub-hook owns one concern (refs, primitive state, native media
 * events, fullscreen sync, drag interactions, auto-pause lifecycle,
 * Picture-in-Picture, etc.) and exposes the minimum surface the
 * orchestrator needs to assemble the public controller object.
 *
 * The returned shape is deliberately the same as before the refactor:
 * the consumer (CustomVideoPlayer.tsx) plugs in the HLS quality
 * controller on top to produce the final CustomVideoPlayerController.
 */
export function useCustomVideoPlayerState(
  props: CustomVideoPlayerProps,
  ref: ForwardedRef<CustomVideoPlayerRef>,
): Omit<CustomVideoPlayerController, 'quality'> {
  const {
    className = '',
    initialPlaybackRate = 1,
    initialTime = 0,
    lessonId,
    onComplete,
    onPiPChange,
    onProgress,
    onTrackingError,
    pauseWhenHidden = true,
    pauseWhenOutsideViewport = false,
    preload = 'metadata',
    seekControlsLocked = false,
    src,
    title,
    trackingId,
  } = props;

  const refs = useVideoRefs();
  const state = usePlaybackState(initialTime, initialPlaybackRate);

  useCustomVideoPlayerTracking({
    lessonId,
    onTrackingError,
    trackingId,
    videoRef: refs.videoRef,
  });

  useVideoAutoPause({
    videoRef: refs.videoRef,
    containerRef: refs.containerRef,
    pauseWhenHidden,
    pauseWhenOutsideViewport,
    src,
    setIsPlaying: state.setIsPlaying,
  });

  useSourceChangeReset({
    videoRef: refs.videoRef,
    src,
    hasNotifiedCompletionRef: refs.hasNotifiedCompletionRef,
    setIsPlaying: state.setIsPlaying,
    setCurrentTime: state.setCurrentTime,
    setDuration: state.setDuration,
    setIsLoading: state.setIsLoading,
    setIsBuffering: state.setIsBuffering,
    setHasInitialTimeSet: state.setHasInitialTimeSet,
  });

  useCustomVideoPlayerImperativeHandle({
    ref,
    isPiP: state.isPiP,
    isPlaying: state.isPlaying,
    videoRef: refs.videoRef,
    setIsPiP: state.setIsPiP,
    onPiPChange,
  });

  useVideoPictureInPicture({
    videoRef: refs.videoRef,
    onPiPChange,
    setIsPiP: state.setIsPiP,
    setIsPlaying: state.setIsPlaying,
  });

  const { resetControlsTimeout } = useControlsAutoHide({
    controlsTimeoutRef: refs.controlsTimeoutRef,
    isHovering: state.isHovering,
    isPlaying: state.isPlaying,
    seekControlsLocked,
    setShowControls: state.setShowControls,
    setIsHovering: state.setIsHovering,
    setIsDraggingProgress: state.setIsDraggingProgress,
  });

  useVideoMediaEvents({
    videoRef: refs.videoRef,
    duration: state.duration,
    initialTime,
    initialPlaybackRate,
    hasInitialTimeSet: state.hasInitialTimeSet,
    hasNotifiedCompletionRef: refs.hasNotifiedCompletionRef,
    lastTimeupdateRenderRef: refs.lastTimeupdateRenderRef,
    onComplete,
    onProgress,
    setIsPlaying: state.setIsPlaying,
    setCurrentTime: state.setCurrentTime,
    setDuration: state.setDuration,
    setIsLoading: state.setIsLoading,
    setIsBuffering: state.setIsBuffering,
    setHasInitialTimeSet: state.setHasInitialTimeSet,
  });

  useForwardSeekGuard({
    duration: state.duration,
    seekControlsLocked,
    setCurrentTime: state.setCurrentTime,
    src,
    videoRef: refs.videoRef,
  });

  useFullscreenSync({
    videoRef: refs.videoRef,
    isPlaying: state.isPlaying,
    setIsFullscreen: state.setIsFullscreen,
  });

  const { updateProgress, updateVolume } = useDragInteractions({
    videoRef: refs.videoRef,
    progressBarRef: refs.progressBarRef,
    volumeBarRef: refs.volumeBarRef,
    duration: state.duration,
    seekControlsLocked,
    isDraggingProgress: state.isDraggingProgress,
    isDraggingVolume: state.isDraggingVolume,
    setCurrentTime: state.setCurrentTime,
    setVolume: state.setVolume,
    setIsMuted: state.setIsMuted,
    setIsDraggingProgress: state.setIsDraggingProgress,
    setIsDraggingVolume: state.setIsDraggingVolume,
  });

  const actions = useVideoActions({
    videoRef: refs.videoRef,
    containerRef: refs.containerRef,
    duration: state.duration,
    volume: state.volume,
    isMuted: state.isMuted,
    isPlaying: state.isPlaying,
    isFullscreen: state.isFullscreen,
    seekControlsLocked,
    setIsPlaying: state.setIsPlaying,
    setIsMuted: state.setIsMuted,
    setIsFullscreen: state.setIsFullscreen,
    setShowControls: state.setShowControls,
    setShowSettings: state.setShowSettings,
    setPlaybackRate: state.setPlaybackRate,
    setCurrentTime: state.setCurrentTime,
  });

  const inputHandlers = useInputHandlers({
    isDraggingProgress: state.isDraggingProgress,
    isDraggingVolume: state.isDraggingVolume,
    seekControlsLocked,
    updateProgress,
    updateVolume,
    setIsDraggingProgress: state.setIsDraggingProgress,
    setIsDraggingVolume: state.setIsDraggingVolume,
    setShowControls: state.setShowControls,
    setShowVolumeControl: state.setShowVolumeControl,
  });

  return {
    ...inputHandlers,
    ...actions,
    changePlaybackRate: actions.changePlaybackRate,
    className,
    containerRef: refs.containerRef,
    currentTime: state.currentTime,
    duration: state.duration,
    formatTime: formatVideoTime,
    handleVideoError: () => {
      state.setIsLoading(false);
      state.setIsBuffering(false);
    },
    handleVideoLoadedData: () => {
      state.setIsLoading(false);
      state.setIsBuffering(false);
    },
    handleVideoLoadStart: () => {
      state.setIsLoading(true);
      state.setIsBuffering(false);
    },
    isBuffering: state.isBuffering,
    isDraggingProgress: state.isDraggingProgress,
    isFullscreen: state.isFullscreen,
    isHovering: state.isHovering,
    isLoading: state.isLoading,
    isMuted: state.isMuted,
    isPiP: state.isPiP,
    isPlaying: state.isPlaying,
    isSeekingLocked: seekControlsLocked,
    onRootMouseEnter: () => state.setIsHovering(true),
    onRootMouseLeave: () => state.setIsHovering(false),
    onRootMouseMove: () => {
      state.setShowControls(true);
      if (state.isPlaying) resetControlsTimeout();
    },
    playbackRate: state.playbackRate,
    playbackRates: VIDEO_PLAYBACK_RATES,
    preload,
    progressBarRef: refs.progressBarRef,
    setShowSettings: state.setShowSettings,
    setShowVolumeControl: state.setShowVolumeControl,
    showControls: state.showControls,
    showSettings: state.showSettings,
    showVolumeControl: state.showVolumeControl,
    src,
    title,
    videoRef: refs.videoRef,
    volume: state.volume,
    volumeBarRef: refs.volumeBarRef,
  };
}
