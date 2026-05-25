import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { isStreamableVideoMimeType } from '@/lib/media';
import {
  getFfmpegPath,
  getFfprobePath,
  getEnvBoolean,
  getMaxSyncTranscodeBytes,
  getTranscodingTimeoutMs,
} from './env';
import { probeVideo } from './probe-video';
import { createPassthroughResult } from './result';
import { resolveRenditions } from './renditions';
import {
  getStorageBasename,
  getStorageDirectory,
  joinStoragePath,
  stripExtension,
} from './storage-paths';
import { transcodeRendition } from './transcode-rendition';
import { uploadHlsDirectory } from './upload-hls-directory';
import { writeMasterPlaylist } from './playlist';
import type { AdaptiveVideoProcessingResult, StoredVideoInput } from './types';
import { downloadSourceVideo } from './workspace-source';

export async function processStoredVideoForAdaptiveStreaming(
  input: StoredVideoInput,
): Promise<AdaptiveVideoProcessingResult> {
  const passthroughResult = getEarlyPassthroughResult(input);
  if (passthroughResult) return passthroughResult;

  const ffmpegPath = getFfmpegPath();
  const ffprobePath = getFfprobePath();
  if (!ffmpegPath || !ffprobePath) {
    return createPassthroughResult(input, 'disabled', 'FFMPEG_PATH and FFPROBE_PATH are required');
  }

  const workspace = createTranscodingWorkspace(input);
  try {
    await mkdir(workspace.outputRoot, { recursive: true });
    await downloadSourceVideo(input, workspace.inputPath);

    const timeoutMs = getTranscodingTimeoutMs();
    const stream = await probeVideo(ffprobePath, workspace.inputPath, timeoutMs);
    const renditions = resolveRenditions(stream);

    for (const rendition of renditions) {
      await transcodeRendition({ ffmpegPath, inputPath: workspace.inputPath, outputRoot: workspace.outputRoot, rendition, timeoutMs });
    }

    const variants = await writeMasterPlaylist({ outputRoot: workspace.outputRoot, renditions, stream });
    await uploadHlsDirectory({ bucket: input.bucket, outputRoot: workspace.outputRoot, storageRoot: workspace.storageRoot, supabase: input.supabase });

    const { data: playbackUrlData } = input.supabase.storage
      .from(input.bucket)
      .getPublicUrl(joinStoragePath(workspace.storageRoot, 'master.m3u8'));

    return {
      playbackPath: workspace.playbackPath,
      playbackUrl: playbackUrlData.publicUrl,
      sourcePath: input.sourcePath,
      sourceUrl: input.publicUrl,
      status: 'ready',
      variants: variants.map((variant) => ({
        ...variant,
        path: joinStoragePath(workspace.playbackPath.replace('/master.m3u8', ''), variant.path),
      })),
    };
  } catch (error) {
    return createPassthroughResult(input, 'failed', error instanceof Error ? error.message : 'Unknown transcoding error');
  } finally {
    await rm(workspace.tempRoot, { force: true, recursive: true });
  }
}

function getEarlyPassthroughResult(input: StoredVideoInput): AdaptiveVideoProcessingResult | null {
  if (!getEnvBoolean('VIDEO_TRANSCODING_ENABLED')) {
    return createPassthroughResult(input, 'disabled', 'VIDEO_TRANSCODING_ENABLED is not true');
  }

  if (!isStreamableVideoMimeType(input.contentType)) {
    return createPassthroughResult(input, 'skipped', 'Unsupported source video type');
  }

  if (input.sizeBytes && input.sizeBytes > getMaxSyncTranscodeBytes()) {
    return createPassthroughResult(input, 'skipped', 'Source video is above sync transcoding limit');
  }

  return null;
}

function createTranscodingWorkspace(input: StoredVideoInput) {
  const tempRoot = path.join(tmpdir(), `soflia-video-${randomUUID()}`);
  const inputPath = path.join(tempRoot, getStorageBasename(input.sourcePath));
  const outputRoot = path.join(tempRoot, 'hls');
  const assetId = stripExtension(getStorageBasename(input.sourcePath));
  const storageRoot = joinStoragePath(getStorageDirectory(input.sourcePath), 'hls', assetId);
  return {
    inputPath,
    outputRoot,
    playbackPath: joinStoragePath(input.bucket, storageRoot, 'master.m3u8'),
    storageRoot,
    tempRoot,
  };
}
