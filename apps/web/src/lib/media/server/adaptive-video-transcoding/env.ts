import {
  DEFAULT_MAX_SYNC_TRANSCODE_BYTES,
  DEFAULT_TRANSCODING_TIMEOUT_MS,
} from './constants';

export function getEnvBoolean(name: string): boolean {
  return process.env[name]?.toLowerCase() === 'true';
}

export function getEnvNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getFfmpegPath(): string | null {
  return process.env.FFMPEG_PATH || process.env.FFMPEG_BINARY || null;
}

export function getFfprobePath(): string | null {
  return process.env.FFPROBE_PATH || process.env.FFPROBE_BINARY || null;
}

export function getMaxSyncTranscodeBytes(): number {
  return getEnvNumber(
    'VIDEO_TRANSCODING_MAX_SYNC_BYTES',
    DEFAULT_MAX_SYNC_TRANSCODE_BYTES,
  );
}

export function getTranscodingTimeoutMs(): number {
  return getEnvNumber(
    'VIDEO_TRANSCODING_TIMEOUT_MS',
    DEFAULT_TRANSCODING_TIMEOUT_MS,
  );
}
