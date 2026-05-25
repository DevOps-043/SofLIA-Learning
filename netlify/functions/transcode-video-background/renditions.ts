import type { HlsRendition, VideoStreamInfo } from './types';
import { even } from './path-utils';

export const DEFAULT_RENDITIONS: HlsRendition[] = [
  { bandwidth: 800_000, bufsize: '1200k', height: 360, maxrate: '856k', name: '360p', videoBitrate: '800k' },
  { bandwidth: 1_400_000, bufsize: '2100k', height: 480, maxrate: '1498k', name: '480p', videoBitrate: '1400k' },
  { bandwidth: 2_800_000, bufsize: '4200k', height: 720, maxrate: '2996k', name: '720p', videoBitrate: '2800k' },
  { bandwidth: 5_000_000, bufsize: '7500k', height: 1080, maxrate: '5350k', name: '1080p', videoBitrate: '5000k' }
];

export function resolveRenditions(stream: VideoStreamInfo): HlsRendition[] {
  const eligible = DEFAULT_RENDITIONS.filter((rendition) => rendition.height <= stream.height);

  if (eligible.length === 0) {
    const height = even(stream.height);
    return [{
      bandwidth: 650_000,
      bufsize: '1000k',
      height,
      maxrate: '700k',
      name: `${height}p`,
      videoBitrate: '650k'
    }];
  }

  if (eligible.length >= 4) {
    return eligible.filter((rendition) => rendition.height !== 360);
  }

  return eligible;
}
