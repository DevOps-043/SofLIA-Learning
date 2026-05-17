import { DEFAULT_RENDITIONS } from './constants';
import type { HlsRendition, VideoStreamInfo } from './types';

export function even(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

export function resolveRenditions(stream: VideoStreamInfo): HlsRendition[] {
  const eligibleRenditions = DEFAULT_RENDITIONS.filter(
    (rendition) => rendition.height <= stream.height,
  );

  if (eligibleRenditions.length > 0) {
    return eligibleRenditions;
  }

  const height = even(stream.height);
  return [
    {
      bandwidth: 650_000,
      bufsize: '1000k',
      height,
      maxrate: '700k',
      name: `${height}p`,
      videoBitrate: '650k',
    },
  ];
}

export function calculateVariantWidth(stream: VideoStreamInfo, height: number): number {
  return even((stream.width / stream.height) * height);
}
