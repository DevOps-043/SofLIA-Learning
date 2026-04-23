import type { ForwardedRef } from 'react';
import { createCustomVideoPlayerController } from './createCustomVideoPlayerController';
import { useCustomVideoPlayerControlsTimeout } from './useCustomVideoPlayerControlsTimeout';
import { useCustomVideoPlayerCoreState } from './useCustomVideoPlayerCoreState';
import { useCustomVideoPlayerDocumentDrag } from './useCustomVideoPlayerDocumentDrag';
import { useCustomVideoPlayerFullscreen } from './useCustomVideoPlayerFullscreen';
import { useCustomVideoPlayerImperativeHandle } from './useCustomVideoPlayerImperativeHandle';
import { useCustomVideoPlayerLifecycle } from './useCustomVideoPlayerLifecycle';
import { useCustomVideoPlayerNativeEvents } from './useCustomVideoPlayerNativeEvents';
import { useCustomVideoPlayerPiP } from './useCustomVideoPlayerPiP';
import { useCustomVideoPlayerPlaybackActions } from './useCustomVideoPlayerPlaybackActions';
import { useCustomVideoPlayerProgressScrubbing } from './useCustomVideoPlayerProgressScrubbing';
import { useCustomVideoPlayerTracking } from './useCustomVideoPlayerTracking';
import { useCustomVideoPlayerVolumeScrubbing } from './useCustomVideoPlayerVolumeScrubbing';
import type {
  CustomVideoPlayerController,
  CustomVideoPlayerProps,
  CustomVideoPlayerRef,
} from './types';

export function useCustomVideoPlayerState(
  {
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
    src,
    title,
    trackingId,
  }: CustomVideoPlayerProps,
  ref: ForwardedRef<CustomVideoPlayerRef>
): CustomVideoPlayerController {
  const state = useCustomVideoPlayerCoreState({ initialPlaybackRate, initialTime });

  useCustomVideoPlayerTracking({ lessonId, onTrackingError, trackingId, videoRef: state.videoRef });
  useCustomVideoPlayerImperativeHandle({
    ref,
    isPiP: state.isPiP,
    isPlaying: state.isPlaying,
    onPiPChange,
    setIsPiP: state.setIsPiP,
    videoRef: state.videoRef,
  });
  useCustomVideoPlayerLifecycle({ ...state, pauseWhenHidden, pauseWhenOutsideViewport, src });
  useCustomVideoPlayerPiP({
    onPiPChange,
    setIsPiP: state.setIsPiP,
    setIsPlaying: state.setIsPlaying,
    videoRef: state.videoRef,
  });

  const resetControlsTimeout = useCustomVideoPlayerControlsTimeout(state);
  useCustomVideoPlayerNativeEvents({
    ...state,
    initialPlaybackRate,
    initialTime,
    onComplete,
    onProgress,
  });
  const toggleFullscreen = useCustomVideoPlayerFullscreen(state);
  const progress = useCustomVideoPlayerProgressScrubbing(state);
  const volume = useCustomVideoPlayerVolumeScrubbing(state);

  useCustomVideoPlayerDocumentDrag({
    ...state,
    updateProgress: progress.updateProgress,
    updateVolume: volume.updateVolume,
  });

  const { updateProgress: _updateProgress, ...progressHandlers } = progress;
  const { updateVolume: _updateVolume, ...volumeHandlers } = volume;
  const actions = useCustomVideoPlayerPlaybackActions(state);

  return createCustomVideoPlayerController({
    actions,
    className,
    fullscreen: { toggleFullscreen },
    preload,
    progressHandlers,
    resetControlsTimeout,
    src,
    state,
    title,
    volumeHandlers,
  });
}
