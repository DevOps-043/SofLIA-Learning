import { runProcess } from './run-process';
import type { VideoStreamInfo } from './types';

export async function probeVideo(
  ffprobePath: string,
  inputPath: string,
  timeoutMs: number,
): Promise<VideoStreamInfo> {
  const output = await runProcess(
    ffprobePath,
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'json',
      inputPath,
    ],
    timeoutMs,
  );
  const parsed = JSON.parse(output) as {
    streams?: Array<{ height?: number; width?: number }>;
  };
  const stream = parsed.streams?.[0];

  if (!stream?.width || !stream.height) {
    throw new Error('Video stream dimensions were not found');
  }

  return { height: stream.height, width: stream.width };
}
