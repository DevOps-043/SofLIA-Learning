import type { VideoPlayerProps } from './VideoPlayer.types';

export function isValidVideoData(
  videoProvider: VideoPlayerProps['videoProvider'],
  videoProviderId: string
): boolean {
  if (!videoProvider || !videoProviderId) {
    return false;
  }

  if (videoProvider === 'youtube') {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoProviderId);
  }

  if (videoProvider === 'vimeo') {
    return /^\d+$/.test(videoProviderId);
  }

  return true;
}
