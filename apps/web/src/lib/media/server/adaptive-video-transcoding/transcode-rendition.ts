import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { runProcess } from './run-process';
import type { HlsRendition } from './types';

interface TranscodeRenditionParams {
  ffmpegPath: string;
  inputPath: string;
  outputRoot: string;
  rendition: HlsRendition;
  timeoutMs: number;
}

export async function transcodeRendition({
  ffmpegPath,
  inputPath,
  outputRoot,
  rendition,
  timeoutMs,
}: TranscodeRenditionParams) {
  const renditionDir = path.join(outputRoot, rendition.name);
  await mkdir(renditionDir, { recursive: true });

  await runProcess(
    ffmpegPath,
    [
      '-y', '-i', inputPath, '-map', '0:v:0', '-map', '0:a:0?', '-vf',
      `scale=-2:${rendition.height}`, '-c:v', 'libx264', '-preset',
      process.env.VIDEO_TRANSCODING_FFMPEG_PRESET || 'veryfast',
      '-crf', process.env.VIDEO_TRANSCODING_CRF || '23', '-profile:v', 'main',
      '-pix_fmt', 'yuv420p', '-sc_threshold', '0', '-g', '48', '-keyint_min',
      '48', '-b:v', rendition.videoBitrate, '-maxrate', rendition.maxrate,
      '-bufsize', rendition.bufsize, '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
      '-ar', '48000', '-hls_time', '6', '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(renditionDir, 'segment_%03d.ts'),
      path.join(renditionDir, 'index.m3u8'),
    ],
    timeoutMs,
  );
}
