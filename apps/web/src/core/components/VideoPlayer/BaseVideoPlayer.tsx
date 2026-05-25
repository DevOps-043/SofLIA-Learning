'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';
import { generateVideoUrl } from './video-url';
import { VideoContent } from './VideoContent';
import type { VideoPlayerProps } from './VideoPlayer.types';
import {
  CustomVideoPlayer,
  type CustomVideoPlayerRef,
} from '../CustomVideoPlayer/CustomVideoPlayer';

export type { CustomVideoPlayerRef as VideoPlayerRef };
export type { VideoPlayerProps } from './VideoPlayer.types';

export const VideoPlayer = forwardRef<CustomVideoPlayerRef, VideoPlayerProps>(
  (props, ref) => {
    const { videoProvider, videoProviderId, playbackContext = 'lesson' } = props;
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasActivatedEmbed, setHasActivatedEmbed] = useState(false);
    const customVideoRef = useRef<CustomVideoPlayerRef>(null);
    const playbackPolicy = useMediaPlaybackPolicy(playbackContext);

    useImperativeHandle(ref, () => ({
      exitPiP: async () => customVideoRef.current?.exitPiP(),
      getVideoElement: () => customVideoRef.current?.getVideoElement() ?? null,
      isPiPActive: () => customVideoRef.current?.isPiPActive() ?? false,
      isPlaying: () => customVideoRef.current?.isPlaying() ?? false,
      requestPiP: async () => customVideoRef.current?.requestPiP(),
    }), []);

    const videoUrl = useMemo(() => {
      if (!videoProvider || !videoProviderId) {
        return '';
      }
      return generateVideoUrl(videoProvider, videoProviderId);
    }, [videoProvider, videoProviderId]);

    useEffect(() => {
      if (!isLoading) {
        return;
      }

      const timeout = setTimeout(() => setIsLoading(false), 5000);
      return () => clearTimeout(timeout);
    }, [isLoading]);

    useEffect(() => {
      setIsLoading(true);
      setError(null);
      setHasActivatedEmbed(false);
    }, [videoProviderId]);

    return (
      <div className={`w-full ${props.className || ''}`}>
        <VideoContent
          {...props}
          CustomVideoPlayer={CustomVideoPlayer}
          customVideoRef={customVideoRef}
          error={error}
          hasActivatedEmbed={hasActivatedEmbed}
          isLoading={isLoading}
          playbackPolicy={playbackPolicy}
          setError={setError}
          setHasActivatedEmbed={setHasActivatedEmbed}
          setIsLoading={setIsLoading}
          videoUrl={videoUrl}
        />
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
