import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  HLS_MANIFEST_MIME_TYPE,
  VIDEO_ASSET_CACHE_CONTROL,
  isStreamableVideoMimeType,
} from '@/lib/media';

const HLS_SEGMENT_MIME_TYPE = 'video/mp2t';
const DEFAULT_TRANSCODING_TIMEOUT_MS = 240_000;
const DEFAULT_MAX_SYNC_TRANSCODE_BYTES = 350 * 1024 * 1024;

interface StoredVideoInput {
  bucket: string;
  contentType: string;
  publicUrl: string;
  sizeBytes?: number;
  sourcePath: string;
  supabase: SupabaseClient;
}

interface VideoStreamInfo {
  height: number;
  width: number;
}

interface HlsRendition {
  bandwidth: number;
  bufsize: string;
  height: number;
  maxrate: string;
  name: string;
  videoBitrate: string;
}

export interface AdaptiveVideoProcessingResult {
  playbackPath: string;
  playbackUrl: string;
  reason?: string;
  sourcePath: string;
  sourceUrl: string;
  status: 'disabled' | 'failed' | 'ready' | 'skipped';
  variants: Array<{
    bandwidth: number;
    height: number;
    path: string;
    width: number;
  }>;
}

const DEFAULT_RENDITIONS: HlsRendition[] = [
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

function getEnvBoolean(name: string): boolean {
  return process.env[name]?.toLowerCase() === 'true';
}

function getEnvNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function createPassthroughResult(
  input: StoredVideoInput,
  status: AdaptiveVideoProcessingResult['status'],
  reason?: string
): AdaptiveVideoProcessingResult {
  return {
    playbackPath: input.sourcePath,
    playbackUrl: input.publicUrl,
    reason,
    sourcePath: input.sourcePath,
    sourceUrl: input.publicUrl,
    status,
    variants: [],
  };
}

function getFfmpegPath(): string | null {
  return process.env.FFMPEG_PATH || process.env.FFMPEG_BINARY || null;
}

function getFfprobePath(): string | null {
  return process.env.FFPROBE_PATH || process.env.FFPROBE_BINARY || null;
}

function getStorageDirectory(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, '/');
  const lastSlashIndex = normalized.lastIndexOf('/');
  return lastSlashIndex >= 0 ? normalized.slice(0, lastSlashIndex) : '';
}

function getStorageBasename(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, '/');
  const lastSlashIndex = normalized.lastIndexOf('/');
  return lastSlashIndex >= 0 ? normalized.slice(lastSlashIndex + 1) : normalized;
}

function stripExtension(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf('.');
  return extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
}

function joinStoragePath(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

function getContentType(filePath: string): string {
  if (filePath.endsWith('.m3u8')) {
    return HLS_MANIFEST_MIME_TYPE;
  }

  if (filePath.endsWith('.ts')) {
    return HLS_SEGMENT_MIME_TYPE;
  }

  return 'application/octet-stream';
}

function even(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

function resolveRenditions(stream: VideoStreamInfo): HlsRendition[] {
  const eligibleRenditions = DEFAULT_RENDITIONS.filter(
    (rendition) => rendition.height <= stream.height
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

function calculateVariantWidth(stream: VideoStreamInfo, height: number): number {
  return even((stream.width / stream.height) * height);
}

async function runProcess(
  command: string,
  args: string[],
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
    });
    let output = '';
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill('SIGKILL');
      reject(new Error(`Process timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const appendOutput = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 12_000) {
        output = output.slice(-12_000);
      }
    };

    child.stdout.on('data', appendOutput);
    child.stderr.on('data', appendOutput);
    child.on('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(output || `Process exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function probeVideo(
  ffprobePath: string,
  inputPath: string,
  timeoutMs: number
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
    timeoutMs
  );
  const parsed = JSON.parse(output) as {
    streams?: Array<{ height?: number; width?: number }>;
  };
  const stream = parsed.streams?.[0];

  if (!stream?.width || !stream.height) {
    throw new Error('Video stream dimensions were not found');
  }

  return {
    height: stream.height,
    width: stream.width,
  };
}

async function transcodeRendition({
  ffmpegPath,
  inputPath,
  outputRoot,
  rendition,
  timeoutMs,
}: {
  ffmpegPath: string;
  inputPath: string;
  outputRoot: string;
  rendition: HlsRendition;
  timeoutMs: number;
}) {
  const renditionDir = path.join(outputRoot, rendition.name);
  await mkdir(renditionDir, { recursive: true });

  await runProcess(
    ffmpegPath,
    [
      '-y',
      '-i',
      inputPath,
      '-map',
      '0:v:0',
      '-map',
      '0:a:0?',
      '-vf',
      `scale=-2:${rendition.height}`,
      '-c:v',
      'libx264',
      '-preset',
      process.env.VIDEO_TRANSCODING_FFMPEG_PRESET || 'veryfast',
      '-crf',
      process.env.VIDEO_TRANSCODING_CRF || '23',
      '-profile:v',
      'main',
      '-pix_fmt',
      'yuv420p',
      '-sc_threshold',
      '0',
      '-g',
      '48',
      '-keyint_min',
      '48',
      '-b:v',
      rendition.videoBitrate,
      '-maxrate',
      rendition.maxrate,
      '-bufsize',
      rendition.bufsize,
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-ac',
      '2',
      '-ar',
      '48000',
      '-hls_time',
      '6',
      '-hls_playlist_type',
      'vod',
      '-hls_segment_filename',
      path.join(renditionDir, 'segment_%03d.ts'),
      path.join(renditionDir, 'index.m3u8'),
    ],
    timeoutMs
  );
}

async function writeMasterPlaylist({
  outputRoot,
  renditions,
  stream,
}: {
  outputRoot: string;
  renditions: HlsRendition[];
  stream: VideoStreamInfo;
}): Promise<Array<{ bandwidth: number; height: number; path: string; width: number }>> {
  const variants = renditions.map((rendition) => {
    const width = calculateVariantWidth(stream, rendition.height);
    return {
      bandwidth: rendition.bandwidth,
      height: rendition.height,
      path: `${rendition.name}/index.m3u8`,
      width,
    };
  });
  const manifest = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    ...variants.flatMap((variant) => [
      `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.width}x${variant.height}`,
      variant.path,
    ]),
    '',
  ].join('\n');

  await writeFile(path.join(outputRoot, 'master.m3u8'), manifest, 'utf8');
  return variants;
}

async function listFilesRecursive(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursive(entryPath);
      }
      return [entryPath];
    })
  );

  return nestedFiles.flat();
}

async function uploadHlsDirectory({
  bucket,
  outputRoot,
  storageRoot,
  supabase,
}: {
  bucket: string;
  outputRoot: string;
  storageRoot: string;
  supabase: SupabaseClient;
}) {
  const files = await listFilesRecursive(outputRoot);

  for (const filePath of files) {
    const relativePath = path
      .relative(outputRoot, filePath)
      .split(path.sep)
      .join('/');
    const storagePath = joinStoragePath(storageRoot, relativePath);
    const body = await readFile(filePath);
    const { error } = await supabase.storage.from(bucket).upload(storagePath, body, {
      cacheControl: VIDEO_ASSET_CACHE_CONTROL,
      contentType: getContentType(filePath),
      upsert: true,
    });

    if (error) {
      throw new Error(`Unable to upload HLS asset ${storagePath}: ${error.message}`);
    }
  }
}

export async function processStoredVideoForAdaptiveStreaming(
  input: StoredVideoInput
): Promise<AdaptiveVideoProcessingResult> {
  if (!getEnvBoolean('VIDEO_TRANSCODING_ENABLED')) {
    return createPassthroughResult(input, 'disabled', 'VIDEO_TRANSCODING_ENABLED is not true');
  }

  if (!isStreamableVideoMimeType(input.contentType)) {
    return createPassthroughResult(input, 'skipped', 'Unsupported source video type');
  }

  const maxSyncTranscodeBytes = getEnvNumber(
    'VIDEO_TRANSCODING_MAX_SYNC_BYTES',
    DEFAULT_MAX_SYNC_TRANSCODE_BYTES
  );
  if (input.sizeBytes && input.sizeBytes > maxSyncTranscodeBytes) {
    return createPassthroughResult(input, 'skipped', 'Source video is above sync transcoding limit');
  }

  const ffmpegPath = getFfmpegPath();
  const ffprobePath = getFfprobePath();

  if (!ffmpegPath || !ffprobePath) {
    return createPassthroughResult(input, 'disabled', 'FFMPEG_PATH and FFPROBE_PATH are required');
  }

  const timeoutMs = getEnvNumber(
    'VIDEO_TRANSCODING_TIMEOUT_MS',
    DEFAULT_TRANSCODING_TIMEOUT_MS
  );
  const tempRoot = path.join(tmpdir(), `soflia-video-${randomUUID()}`);
  const inputPath = path.join(tempRoot, getStorageBasename(input.sourcePath));
  const outputRoot = path.join(tempRoot, 'hls');
  const sourceDirectory = getStorageDirectory(input.sourcePath);
  const assetId = stripExtension(getStorageBasename(input.sourcePath));
  const storageRoot = joinStoragePath(sourceDirectory, 'hls', assetId);
  const playbackPath = joinStoragePath(input.bucket, storageRoot, 'master.m3u8');

  try {
    await mkdir(outputRoot, { recursive: true });

    const { data: sourceBlob, error: downloadError } = await input.supabase.storage
      .from(input.bucket)
      .download(input.sourcePath);

    if (downloadError || !sourceBlob) {
      throw new Error(downloadError?.message || 'Unable to download source video');
    }

    const sourceBuffer = Buffer.from(await sourceBlob.arrayBuffer());
    await writeFile(inputPath, sourceBuffer);

    const stream = await probeVideo(ffprobePath, inputPath, timeoutMs);
    const renditions = resolveRenditions(stream);

    for (const rendition of renditions) {
      await transcodeRendition({
        ffmpegPath,
        inputPath,
        outputRoot,
        rendition,
        timeoutMs,
      });
    }

    const variants = await writeMasterPlaylist({ outputRoot, renditions, stream });
    await uploadHlsDirectory({
      bucket: input.bucket,
      outputRoot,
      storageRoot,
      supabase: input.supabase,
    });

    const { data: playbackUrlData } = input.supabase.storage
      .from(input.bucket)
      .getPublicUrl(joinStoragePath(storageRoot, 'master.m3u8'));

    return {
      playbackPath,
      playbackUrl: playbackUrlData.publicUrl,
      sourcePath: input.sourcePath,
      sourceUrl: input.publicUrl,
      status: 'ready',
      variants: variants.map((variant) => ({
        ...variant,
        path: joinStoragePath(playbackPath.replace('/master.m3u8', ''), variant.path),
      })),
    };
  } catch (error) {
    return createPassthroughResult(
      input,
      'failed',
      error instanceof Error ? error.message : 'Unknown transcoding error'
    );
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}
