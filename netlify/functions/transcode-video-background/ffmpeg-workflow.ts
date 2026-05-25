import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { TRANSCODING_TIMEOUT_MS } from './constants';
import { getEnv } from './env';
import { even } from './path-utils';
import { runProcess } from './process-runner';
import type { HlsRendition, VideoStreamInfo } from './types';

export async function probeVideo(ffmpegPath: string, inputPath: string): Promise<VideoStreamInfo> {
  const output = await runProcess(
    ffmpegPath,
    ['-hide_banner', '-i', inputPath],
    TRANSCODING_TIMEOUT_MS,
    { acceptNonZeroExit: true, maxOutputBytes: 100_000 }
  );
  const match = output.match(/Stream #\d+:\d+[^\n]*Video:[^\n]*?\s(\d{2,5})x(\d{2,5})\b/);

  if (!match) throw new Error('Video stream dimensions not found in ffmpeg output');

  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid parsed dimensions: ${width}x${height}`);
  }

  return { height, width };
}

export async function transcodeRendition(
  ffmpegPath: string,
  inputPath: string,
  outputRoot: string,
  rendition: HlsRendition
) {
  const renditionDir = path.join(outputRoot, rendition.name);
  await mkdir(renditionDir, { recursive: true });
  await runProcess(ffmpegPath, createTranscodeArgs(inputPath, renditionDir, rendition), TRANSCODING_TIMEOUT_MS);
}

export async function writeMasterPlaylist(
  outputRoot: string,
  renditions: HlsRendition[],
  stream: VideoStreamInfo
) {
  const variants = renditions.map((rendition) => ({
    bandwidth: rendition.bandwidth,
    height: rendition.height,
    path: `${rendition.name}/index.m3u8`,
    width: even((stream.width / stream.height) * rendition.height)
  }));
  const manifest = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    ...variants.flatMap((variant) => [
      `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.width}x${variant.height}`,
      variant.path
    ]),
    ''
  ].join('\n');

  await writeFile(path.join(outputRoot, 'master.m3u8'), manifest, 'utf8');
  return variants;
}

function createTranscodeArgs(inputPath: string, renditionDir: string, rendition: HlsRendition) {
  return [
    '-y', '-i', inputPath, '-map', '0:v:0', '-map', '0:a:0?', '-vf', `scale=-2:${rendition.height}`,
    '-c:v', 'libx264', '-preset', getEnv('VIDEO_TRANSCODING_FFMPEG_PRESET') ?? 'superfast',
    '-crf', getEnv('VIDEO_TRANSCODING_CRF') ?? '23', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
    '-sc_threshold', '0', '-g', '48', '-keyint_min', '48', '-b:v', rendition.videoBitrate,
    '-maxrate', rendition.maxrate, '-bufsize', rendition.bufsize, '-c:a', 'aac', '-b:a', '96k',
    '-ac', '2', '-ar', '48000', '-hls_time', '6', '-hls_playlist_type', 'vod',
    '-hls_segment_filename', path.join(renditionDir, 'segment_%03d.ts'),
    path.join(renditionDir, 'index.m3u8')
  ];
}
