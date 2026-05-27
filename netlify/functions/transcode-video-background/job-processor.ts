import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createAdminClient, getEnv } from './env';
import { resolveFfmpegPath } from './ffmpeg-path';
import { probeVideo, transcodeRendition, writeMasterPlaylist } from './ffmpeg-workflow';
import {
  getStorageBasename,
  getStorageDirectory,
  joinStoragePath,
  stripExtension
} from './path-utils';
import { resolveRenditions } from './renditions';
import { uploadHlsDirectory } from './storage-upload';
import type { TranscodeJobPayload } from './types';

export async function processTranscodeJob(payload: TranscodeJobPayload) {
  const { bucket, jobId, sizeBytes, sourcePath } = payload;
  const supabase = createAdminClient();

  await markJobProcessing(supabase, jobId);
  const ffmpegPath = await resolveFfmpegPath().catch(async (error) => {
    const message = error instanceof Error ? error.message : 'Unknown';
    await markJobFailed(supabase, jobId, `ffmpeg not found: ${message}`);
    return null;
  });

  if (!ffmpegPath) return;

  const workspace = createWorkspacePaths(sourcePath);

  try {
    await mkdir(workspace.outputRoot, { recursive: true });
    await downloadSource(supabase, bucket, sourcePath, payload.sourceUrl, workspace.inputPath, sizeBytes);
    const stream = await probeVideo(ffmpegPath, workspace.inputPath);
    const renditions = resolveRenditions(stream);
    console.log(`[transcode-bg] ${stream.width}x${stream.height} -> ${renditions.map((r) => r.name).join(', ')}`);

    for (const rendition of renditions) {
      const startedAt = Date.now();
      console.log(`[transcode-bg] Transcoding ${rendition.name}...`);
      await transcodeRendition(ffmpegPath, workspace.inputPath, workspace.outputRoot, rendition);
      console.log(`[transcode-bg] ${rendition.name} done in ${Math.round((Date.now() - startedAt) / 1000)}s`);
    }

    await writeMasterPlaylist(workspace.outputRoot, renditions, stream);
    await uploadHlsDirectory(supabase, bucket, workspace.outputRoot, workspace.storageRoot);
    await markJobCompleted(supabase, bucket, jobId, workspace.storageRoot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[transcode-bg] Job ${jobId} failed:`, message);
    await markJobFailed(supabase, jobId, message);
  } finally {
    await rm(workspace.tempRoot, { force: true, recursive: true }).catch(() => undefined);
  }
}

function createWorkspacePaths(sourcePath: string) {
  const tempRoot = path.join(tmpdir(), `soflia-transcode-${randomUUID()}`);
  const storageDir = getStorageDirectory(sourcePath);
  const assetId = stripExtension(getStorageBasename(sourcePath));

  return {
    inputPath: path.join(tempRoot, getStorageBasename(sourcePath)),
    outputRoot: path.join(tempRoot, 'hls'),
    storageRoot: joinStoragePath(storageDir, 'hls', assetId),
    tempRoot
  };
}

async function downloadSource(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  sourcePath: string,
  sourceUrl: string,
  inputPath: string,
  sizeBytes?: number
) {
  const currentProjectUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') ?? ''
  const isCurrentProject = currentProjectUrl && sourceUrl.startsWith(currentProjectUrl)

  let buffer: Buffer

  if (isCurrentProject || !sourceUrl.startsWith('http')) {
    const { data: blob, error } = await supabase.storage.from(bucket).download(sourcePath)
    if (error || !blob) throw new Error(error?.message ?? 'Failed to download source video')
    buffer = Buffer.from(await blob.arrayBuffer())
  } else {
    console.log(`[transcode-bg] Fetching source from external URL: ${sourceUrl.slice(0, 100)}`)
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(300_000) })
    if (!response.ok) throw new Error(`Failed to fetch source from external URL: HTTP ${response.status}`)
    buffer = Buffer.from(await response.arrayBuffer())
  }

  await writeFile(inputPath, buffer)
  console.log(`[transcode-bg] Downloaded source (${((sizeBytes ?? 0) / 1_048_576).toFixed(1)} MB)`)
}

async function markJobProcessing(supabase: ReturnType<typeof createAdminClient>, jobId: string) {
  await supabase.from('video_transcoding_jobs').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', jobId);
}

async function markJobCompleted(supabase: ReturnType<typeof createAdminClient>, bucket: string, jobId: string, storageRoot: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(joinStoragePath(storageRoot, 'master.m3u8'));
  await supabase.from('video_transcoding_jobs').update({
    completed_at: new Date().toISOString(),
    result_path: joinStoragePath(bucket, storageRoot, 'master.m3u8'),
    result_url: data.publicUrl,
    status: 'completed'
  }).eq('id', jobId);
}

async function markJobFailed(supabase: ReturnType<typeof createAdminClient>, jobId: string, message: string) {
  await supabase.from('video_transcoding_jobs').update({ completed_at: new Date().toISOString(), error_message: message, status: 'failed' }).eq('id', jobId);
}
