import type { ProviderPlayerProps } from './VideoPlayer.types';
import { VideoPlayer } from './BaseVideoPlayer';

export function YouTubePlayer(props: ProviderPlayerProps) {
  return (
    <VideoPlayer
      videoProvider="youtube"
      videoProviderId={props.videoId}
      title={props.title}
      className={props.className || ''}
      onProgress={props.onProgress}
      onComplete={props.onComplete}
      initialTime={props.initialTime}
      initialPlaybackRate={props.initialPlaybackRate}
      playbackContext={props.playbackContext}
    />
  );
}

export function VimeoPlayer(props: ProviderPlayerProps) {
  return (
    <VideoPlayer
      videoProvider="vimeo"
      videoProviderId={props.videoId}
      title={props.title}
      className={props.className || ''}
      onProgress={props.onProgress}
      onComplete={props.onComplete}
      initialTime={props.initialTime}
      initialPlaybackRate={props.initialPlaybackRate}
      playbackContext={props.playbackContext}
    />
  );
}

export function DirectVideoPlayer(props: Omit<ProviderPlayerProps, 'videoId'> & {
  videoUrl: string;
}) {
  return (
    <VideoPlayer
      videoProvider="direct"
      videoProviderId={props.videoUrl}
      title={props.title}
      className={props.className || ''}
      onProgress={props.onProgress}
      onComplete={props.onComplete}
      initialTime={props.initialTime}
      initialPlaybackRate={props.initialPlaybackRate}
      playbackContext={props.playbackContext}
    />
  );
}
