import { HLS_MANIFEST_MIME_TYPE } from '@/lib/media';
import type { HlsRendition } from './types';

export const HLS_SEGMENT_MIME_TYPE = 'video/mp2t';
export const DEFAULT_TRANSCODING_TIMEOUT_MS = 240_000;
export const DEFAULT_MAX_SYNC_TRANSCODE_BYTES = 350 * 1024 * 1024;

export const DEFAULT_RENDITIONS: HlsRendition[] = [
  {
    bandwidth: 800_000,
    bufsize: '1200k',
    height: 360,
    maxrate: '856k',
    name: '360p',
    videoBitrate: '800k',
  },
  {
    bandwidth: 1_400_000,
    bufsize: '2100k',
    height: 480,
    maxrate: '1498k',
    name: '480p',
    videoBitrate: '1400k',
  },
  {
    bandwidth: 2_800_000,
    bufsize: '4200k',
    height: 720,
    maxrate: '2996k',
    name: '720p',
    videoBitrate: '2800k',
  },
  {
    bandwidth: 5_000_000,
    bufsize: '7500k',
    height: 1080,
    maxrate: '5350k',
    name: '1080p',
    videoBitrate: '5000k',
  },
];

export function getContentType(filePath: string): string {
  if (filePath.endsWith('.m3u8')) return HLS_MANIFEST_MIME_TYPE;
  if (filePath.endsWith('.ts')) return HLS_SEGMENT_MIME_TYPE;
  return 'application/octet-stream';
}
