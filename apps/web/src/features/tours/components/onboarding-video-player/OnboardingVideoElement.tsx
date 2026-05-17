import {
  NATIVE_VIDEO_BUFFERING_DELAY_MS,
  NATIVE_VIDEO_STALLED_DELAY_MS,
  hasNativeVideoPlayableData,
} from '@/lib/media';
import type { OnboardingVideoController } from './useOnboardingVideoPlayer';

export function OnboardingVideoElement({ player }: { player: OnboardingVideoController }) {
  return (
    <video
      key={player.currentVideoSrc}
      ref={player.videoRef}
      className={`h-full w-full object-contain ${player.hasError ? 'hidden' : 'block'}`}
      muted={player.isMuted}
      onCanPlay={player.handleCanPlay}
      onCanPlayThrough={player.markVideoResponsive}
      onClick={player.togglePlay}
      onEnded={player.handleVideoEnd}
      onError={() => {
        player.clearBufferingTimeout();
        player.setHasError(true);
        player.setIsBuffering(false);
      }}
      onLoadStart={() => {
        player.clearBufferingTimeout();
        player.setIsBuffering(true);
      }}
      onLoadedData={player.markVideoResponsive}
      onLoadedMetadata={player.handleLoadedMetadata}
      onPause={() => {
        player.clearBufferingTimeout();
        player.setIsBuffering(false);
        player.setIsPlaying(false);
      }}
      onPlay={() => {
        player.setIsPlaying(true);
        if (hasNativeVideoPlayableData(player.videoRef.current)) player.markVideoResponsive();
        else player.scheduleBufferingIndicator(NATIVE_VIDEO_BUFFERING_DELAY_MS);
      }}
      onPlaying={player.handlePlaying}
      onProgress={player.handleProgressEvent}
      onSeeked={player.handleProgressEvent}
      onStalled={() => player.scheduleBufferingIndicator(NATIVE_VIDEO_STALLED_DELAY_MS)}
      onTimeUpdate={player.handleTimeUpdate}
      onWaiting={() => player.scheduleBufferingIndicator(NATIVE_VIDEO_BUFFERING_DELAY_MS)}
      playsInline
      preload={player.playbackPolicy.nativeVideoPreload}
      src={player.currentVideoSrc}
    />
  );
}
