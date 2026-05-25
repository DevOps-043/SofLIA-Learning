import { useTranslation } from 'react-i18next';

import { isValidVideoData } from './video-validation';
import { DirectVideoContent } from './DirectVideoContent';
import { getIframeAllow } from './iframe-allow';
import { EmbedVideoFrame } from './EmbedVideoFrame';
import {
  EmbedFacade,
  InvalidVideoState,
  VideoErrorState,
  VideoUnavailableState,
} from './VideoStates';
import type {
  VideoContentStateProps,
  VideoPlayerProps,
} from './VideoPlayer.types';
import { CustomVideoPlayer as CustomVideoPlayerComponent } from '../CustomVideoPlayer/CustomVideoPlayer';
import type { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';

type PlaybackPolicy = ReturnType<typeof useMediaPlaybackPolicy>;

interface VideoContentProps extends VideoPlayerProps, VideoContentStateProps {
  CustomVideoPlayer: typeof CustomVideoPlayerComponent;
  playbackPolicy: PlaybackPolicy;
}

export function VideoContent(props: VideoContentProps) {
  const { t } = useTranslation('common');

  if (props.error) {
    return (
      <VideoErrorState
        error={props.error}
        videoProvider={props.videoProvider}
        videoProviderId={props.videoProviderId}
      />
    );
  }

  if (!isValidVideoData(props.videoProvider, props.videoProviderId)) {
    return (
      <InvalidVideoState
        videoProvider={props.videoProvider}
        videoProviderId={props.videoProviderId}
      />
    );
  }

  if (!props.videoUrl) {
    return <VideoUnavailableState />;
  }

  if (props.videoProvider === 'direct' || props.videoProvider === 'custom') {
    return (
      <DirectVideoContent
        {...props}
        CustomVideoPlayer={props.CustomVideoPlayer}
        customVideoRef={props.customVideoRef}
        playbackPolicy={props.playbackPolicy}
        videoUrl={props.videoUrl}
      />
    );
  }

  const shouldRenderEmbed =
    !props.playbackPolicy.shouldUseEmbedFacade || props.hasActivatedEmbed;
  const thumbnailUrl =
    props.videoProvider === 'youtube'
      ? `https://img.youtube.com/vi/${props.videoProviderId}/hqdefault.jpg`
      : null;

  if (!shouldRenderEmbed) {
    return (
      <EmbedFacade
        onActivate={() => {
          props.setHasActivatedEmbed(true);
          props.setIsLoading(true);
        }}
        tapToPlayLabel={t('media.tapToPlay')}
        thumbnailAlt={props.title || t('media.videoPreview')}
        thumbnailUrl={thumbnailUrl}
      />
    );
  }

  return (
    <EmbedVideoFrame
      iframeAllow={getIframeAllow(props.playbackPolicy.allowIframeAutoplay)}
      isLoading={props.isLoading}
      onError={() => {
        props.setIsLoading(false);
        props.setError('Error al cargar el video');
      }}
      onLoad={() => {
        props.setIsLoading(false);
        props.setError(null);
      }}
      title={props.title || 'Video de la leccion'}
      videoUrl={props.videoUrl}
    />
  );
}
