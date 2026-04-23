import type { CustomVideoPlayerController } from './types';
import type { CustomVideoPlayerCoreState } from './useCustomVideoPlayerCoreState';
import {
  formatVideoTime,
  VIDEO_PLAYBACK_RATES,
} from './video-player.utils';

interface ControllerParams {
  actions: Pick<
    CustomVideoPlayerController,
    'changePlaybackRate' | 'skip' | 'toggleMute' | 'togglePictureInPicture' | 'togglePlay'
  >;
  className: string;
  fullscreen: Pick<CustomVideoPlayerController, 'toggleFullscreen'>;
  preload: CustomVideoPlayerController['preload'];
  progressHandlers: Pick<
    CustomVideoPlayerController,
    | 'handleProgressClick'
    | 'handleProgressMouseDown'
    | 'handleProgressMouseMove'
    | 'handleProgressMouseUp'
    | 'handleProgressTouchEnd'
    | 'handleProgressTouchMove'
    | 'handleProgressTouchStart'
  >;
  src: string;
  state: CustomVideoPlayerCoreState;
  title?: string;
  volumeHandlers: Pick<
    CustomVideoPlayerController,
    | 'handleVolumeClick'
    | 'handleVolumeMouseDown'
    | 'handleVolumeMouseMove'
    | 'handleVolumeMouseUp'
    | 'handleVolumeTouchEnd'
    | 'handleVolumeTouchMove'
    | 'handleVolumeTouchStart'
  >;
  resetControlsTimeout: () => void;
}

export function createCustomVideoPlayerController({
  actions,
  className,
  fullscreen,
  preload,
  progressHandlers,
  resetControlsTimeout,
  src,
  state,
  title,
  volumeHandlers,
}: ControllerParams): CustomVideoPlayerController {
  return {
    ...actions,
    ...fullscreen,
    ...progressHandlers,
    ...volumeHandlers,
    className,
    containerRef: state.containerRef,
    currentTime: state.currentTime,
    duration: state.duration,
    formatTime: formatVideoTime,
    handleVideoError: buildVideoErrorHandler(state),
    handleVideoLoadedData: () => state.setIsLoading(false),
    handleVideoLoadStart: () => state.setIsLoading(true),
    isBuffering: state.isBuffering,
    isDraggingProgress: state.isDraggingProgress,
    isFullscreen: state.isFullscreen,
    isHovering: state.isHovering,
    isLoading: state.isLoading,
    isMuted: state.isMuted,
    isPiP: state.isPiP,
    isPlaying: state.isPlaying,
    onRootMouseEnter: () => state.setIsHovering(true),
    onRootMouseLeave: () => state.setIsHovering(false),
    onRootMouseMove: buildRootMouseMoveHandler(state, resetControlsTimeout),
    playbackRate: state.playbackRate,
    playbackRates: VIDEO_PLAYBACK_RATES,
    preload,
    progressBarRef: state.progressBarRef,
    setShowSettings: state.setShowSettings,
    setShowVolumeControl: state.setShowVolumeControl,
    showControls: state.showControls,
    showSettings: state.showSettings,
    showVolumeControl: state.showVolumeControl,
    src,
    title,
    videoRef: state.videoRef,
    volume: state.volume,
    volumeBarRef: state.volumeBarRef,
  };
}

function buildVideoErrorHandler(state: CustomVideoPlayerCoreState) {
  return () => {
    state.setIsLoading(false);
    state.setIsBuffering(false);
  };
}

function buildRootMouseMoveHandler(
  state: CustomVideoPlayerCoreState,
  resetControlsTimeout: () => void,
) {
  return () => {
    state.setShowControls(true);
    if (state.isPlaying) resetControlsTimeout();
  };
}
