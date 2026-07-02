import { CustomVideoPlayer as CustomVideoPlayerComponent } from '../CustomVideoPlayer/CustomVideoPlayer';
import { getPreferredPlaybackRate } from '../CustomVideoPlayer/player/video-playback-rate-preference';
import type {
  VideoContentStateProps,
  VideoPlayerProps,
} from './VideoPlayer.types';
import type { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';

type PlaybackPolicy = ReturnType<typeof useMediaPlaybackPolicy>;

interface DirectVideoContentProps
  extends VideoPlayerProps,
    Pick<VideoContentStateProps, 'customVideoRef' | 'videoUrl'> {
  CustomVideoPlayer: typeof CustomVideoPlayerComponent;
  playbackPolicy: PlaybackPolicy;
}

export function DirectVideoContent(props: DirectVideoContentProps) {
  return (
    <props.CustomVideoPlayer
      ref={props.customVideoRef}
      src={props.videoUrl}
      title={props.title}
      className="w-full h-full"
      onProgress={props.onProgress}
      onComplete={props.onComplete}
      onPiPChange={props.onPiPChange}
      initialTime={props.initialTime ?? 0}
      initialPlaybackRate={props.initialPlaybackRate ?? getPreferredPlaybackRate()}
      pauseWhenHidden={props.playbackPolicy.pauseWhenHidden}
      pauseWhenOutsideViewport={props.playbackPolicy.pauseWhenOutsideViewport}
      preload={props.playbackPolicy.nativeVideoPreload}
      seekControlsLocked={props.seekControlsLocked ?? false}
      lessonId={props.lessonId}
      enrollmentId={props.enrollmentId}
      organizationId={props.organizationId}
      trackingId={props.trackingId}
    />
  );
}
