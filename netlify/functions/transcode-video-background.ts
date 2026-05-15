/**
 * Netlify Background Function: transcode-video-background
 *
 * Receives a transcoding job dispatched by the Next.js upload route and
 * processes it asynchronously (up to 15 minutes).  Netlify returns 202
 * immediately; this function then runs in the background.
 *
 * Requires Netlify Pro plan or higher for background function support.
 *
 * ffprobe is intentionally NOT bundled — bundling both binaries pushed the
 * function past Netlify's 250 MB cap.  Dimensions are read by parsing
 * `ffmpeg -i` stderr instead.
 *
 * Environment variables needed at runtime:
 *   NEXT_PUBLIC_SUPABASE_URL        — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY       — bypasses RLS for job status updates
 *   FFMPEG_PATH                     — /var/task/apps/web/bin/ffmpeg
 *   TRANSCODING_INTERNAL_SECRET     — shared secret to authenticate the caller
 */

import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Handler, HandlerEvent } from "@netlify/functions";

// ---------------------------------------------------------------------------
// Constants (inlined to avoid Next.js path-alias dependencies)
// ---------------------------------------------------------------------------
const HLS_MANIFEST_MIME_TYPE = "application/x-mpegURL";
const HLS_SEGMENT_MIME_TYPE = "video/mp2t";
const VIDEO_ASSET_CACHE_CONTROL = "31536000";
const TRANSCODING_TIMEOUT_MS = 240_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TranscodeJobPayload {
  jobId: string;
  sourcePath: string;
  sourceUrl: string;
  bucket: string;
  contentType: string;
  sizeBytes?: number;
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

// ---------------------------------------------------------------------------
// HLS rendition ladder
// ---------------------------------------------------------------------------
const DEFAULT_RENDITIONS: HlsRendition[] = [
  { bandwidth: 800_000,   bufsize: "1200k", height: 360,  maxrate: "856k",   name: "360p",  videoBitrate: "800k"  },
  { bandwidth: 1_400_000, bufsize: "2100k", height: 480,  maxrate: "1498k",  name: "480p",  videoBitrate: "1400k" },
  { bandwidth: 2_800_000, bufsize: "4200k", height: 720,  maxrate: "2996k",  name: "720p",  videoBitrate: "2800k" },
  { bandwidth: 5_000_000, bufsize: "7500k", height: 1080, maxrate: "5350k",  name: "1080p", videoBitrate: "5000k" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getEnv(name: string): string | null {
  return process.env[name] ?? null;
}

function even(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

function resolveRenditions(stream: VideoStreamInfo): HlsRendition[] {
  const eligible = DEFAULT_RENDITIONS.filter((r) => r.height <= stream.height);
  if (eligible.length > 0) return eligible;
  const h = even(stream.height);
  return [{ bandwidth: 650_000, bufsize: "1000k", height: h, maxrate: "700k", name: `${h}p`, videoBitrate: "650k" }];
}

function joinStoragePath(...parts: string[]): string {
  return parts.map((p) => p.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
}

function getStorageDirectory(p: string): string {
  const norm = p.replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/");
  return idx >= 0 ? norm.slice(0, idx) : "";
}

function getStorageBasename(p: string): string {
  const norm = p.replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/");
  return idx >= 0 ? norm.slice(idx + 1) : norm;
}

function stripExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(0, idx) : name;
}

function getContentType(filePath: string): string {
  if (filePath.endsWith(".m3u8")) return HLS_MANIFEST_MIME_TYPE;
  if (filePath.endsWith(".ts"))   return HLS_SEGMENT_MIME_TYPE;
  return "application/octet-stream";
}

// ---------------------------------------------------------------------------
// Process runner
// ---------------------------------------------------------------------------
interface RunProcessOptions {
  /** When true, resolves with combined output regardless of exit code.
   *  Needed for `ffmpeg -i` (no output spec) which prints stream info to
   *  stderr and exits with code 1.  Defaults to false. */
  acceptNonZeroExit?: boolean;
  /** Max buffered output kept (tail kept on overflow).  Defaults to 12 KB. */
  maxOutputBytes?: number;
}

function runProcess(
  command: string,
  args: string[],
  timeoutMs: number,
  options: RunProcessOptions = {},
): Promise<string> {
  const { acceptNonZeroExit = false, maxOutputBytes = 12_000 } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, windowsHide: true });
    let output = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error(`Process timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const append = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > maxOutputBytes) output = output.slice(-maxOutputBytes);
    };

    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(err);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0 || acceptNonZeroExit) resolve(output);
      else reject(new Error(output || `Process exited with code ${code ?? "unknown"}`));
    });
  });
}

// ---------------------------------------------------------------------------
// Video dimension probing — via ffmpeg stderr (ffprobe is not bundled)
// ---------------------------------------------------------------------------
// `ffmpeg -hide_banner -i <input>` prints stream info to stderr and exits with
// code 1 (no output spec was provided).  We parse the "WIDTHxHEIGHT" pattern
// from the first video stream line.  Pattern reference:
//   Stream #0:0(und): Video: h264 (Main) (avc1 / 0x31637661),
//     yuv420p(progressive), 1920x1080 [SAR 1:1 DAR 16:9], 5000 kb/s, 30 fps
async function probeVideo(ffmpegPath: string, inputPath: string): Promise<VideoStreamInfo> {
  const output = await runProcess(
    ffmpegPath,
    ["-hide_banner", "-i", inputPath],
    TRANSCODING_TIMEOUT_MS,
    { acceptNonZeroExit: true, maxOutputBytes: 100_000 },
  );
  const match = output.match(/Stream #\d+:\d+[^\n]*Video:[^\n]*?\s(\d{2,5})x(\d{2,5})\b/);
  if (!match) {
    throw new Error("Video stream dimensions not found in ffmpeg output");
  }
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid parsed dimensions: ${width}x${height}`);
  }
  return { width, height };
}

// ---------------------------------------------------------------------------
// FFmpeg — one rendition
// ---------------------------------------------------------------------------
async function transcodeRendition(
  ffmpegPath: string,
  inputPath: string,
  outputRoot: string,
  rendition: HlsRendition,
): Promise<void> {
  const renditionDir = path.join(outputRoot, rendition.name);
  await mkdir(renditionDir, { recursive: true });
  await runProcess(
    ffmpegPath,
    [
      "-y", "-i", inputPath,
      "-map", "0:v:0", "-map", "0:a:0?",
      "-vf", `scale=-2:${rendition.height}`,
      "-c:v", "libx264",
      "-preset", getEnv("VIDEO_TRANSCODING_FFMPEG_PRESET") ?? "veryfast",
      "-crf", getEnv("VIDEO_TRANSCODING_CRF") ?? "23",
      "-profile:v", "main",
      "-pix_fmt", "yuv420p",
      "-sc_threshold", "0",
      "-g", "48", "-keyint_min", "48",
      "-b:v", rendition.videoBitrate,
      "-maxrate", rendition.maxrate,
      "-bufsize", rendition.bufsize,
      "-c:a", "aac", "-b:a", "96k", "-ac", "2", "-ar", "48000",
      "-hls_time", "6",
      "-hls_playlist_type", "vod",
      "-hls_segment_filename", path.join(renditionDir, "segment_%03d.ts"),
      path.join(renditionDir, "index.m3u8"),
    ],
    TRANSCODING_TIMEOUT_MS,
  );
}

// ---------------------------------------------------------------------------
// Master playlist
// ---------------------------------------------------------------------------
async function writeMasterPlaylist(
  outputRoot: string,
  renditions: HlsRendition[],
  stream: VideoStreamInfo,
): Promise<Array<{ bandwidth: number; height: number; path: string; width: number }>> {
  const variants = renditions.map((r) => ({
    bandwidth: r.bandwidth,
    height: r.height,
    path: `${r.name}/index.m3u8`,
    width: even((stream.width / stream.height) * r.height),
  }));
  const manifest = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    ...variants.flatMap((v) => [
      `#EXT-X-STREAM-INF:BANDWIDTH=${v.bandwidth},RESOLUTION=${v.width}x${v.height}`,
      v.path,
    ]),
    "",
  ].join("\n");
  await writeFile(path.join(outputRoot, "master.m3u8"), manifest, "utf8");
  return variants;
}

// ---------------------------------------------------------------------------
// Recursive file listing
// ---------------------------------------------------------------------------
async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? listFiles(full) : Promise.resolve([full]);
    }),
  );
  return nested.flat();
}

// ---------------------------------------------------------------------------
// Upload HLS directory to Supabase Storage
// ---------------------------------------------------------------------------
async function uploadHlsDirectory(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  outputRoot: string,
  storageRoot: string,
): Promise<void> {
  const files = await listFiles(outputRoot);
  for (const filePath of files) {
    const rel = path.relative(outputRoot, filePath).split(path.sep).join("/");
    const dest = joinStoragePath(storageRoot, rel);
    const body = await readFile(filePath);
    const { error } = await supabase.storage.from(bucket).upload(dest, body, {
      cacheControl: VIDEO_ASSET_CACHE_CONTROL,
      contentType: getContentType(filePath),
      upsert: true,
    });
    if (error) throw new Error(`Upload failed for ${dest}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Supabase admin client
// ---------------------------------------------------------------------------
function createAdminClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
const handler: Handler = async (event: HandlerEvent) => {
  // Background functions only accept POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Validate shared secret
  const secret = getEnv("TRANSCODING_INTERNAL_SECRET");
  const authHeader = event.headers["authorization"] ?? event.headers["Authorization"] ?? "";
  if (!secret || authHeader !== `Bearer ${secret}`) {
    console.error("[transcode-bg] Unauthorized request");
    return { statusCode: 401, body: "Unauthorized" };
  }

  let payload: TranscodeJobPayload;
  try {
    payload = JSON.parse(event.body ?? "{}") as TranscodeJobPayload;
    if (!payload.jobId || !payload.sourcePath || !payload.sourceUrl || !payload.bucket || !payload.contentType) {
      throw new Error("Missing required fields");
    }
  } catch (err) {
    console.error("[transcode-bg] Invalid payload:", err);
    return { statusCode: 400, body: "Bad Request" };
  }

  const { jobId, sourcePath, sourceUrl, bucket, contentType, sizeBytes } = payload;
  console.log(`[transcode-bg] Starting job ${jobId} — ${sourcePath}`);

  const supabase = createAdminClient();

  // Mark job as processing
  await supabase.from("video_transcoding_jobs").update({
    status: "processing",
    started_at: new Date().toISOString(),
  }).eq("id", jobId);

  const ffmpegPath = getEnv("FFMPEG_PATH");

  if (!ffmpegPath) {
    await supabase.from("video_transcoding_jobs").update({
      status: "failed",
      error_message: "FFMPEG_PATH not configured",
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
    return { statusCode: 202, body: "" };
  }

  const tempRoot   = path.join(tmpdir(), `soflia-transcode-${randomUUID()}`);
  const inputPath  = path.join(tempRoot, getStorageBasename(sourcePath));
  const outputRoot = path.join(tempRoot, "hls");
  const storageDir = getStorageDirectory(sourcePath);
  const assetId    = stripExtension(getStorageBasename(sourcePath));
  const storageRoot = joinStoragePath(storageDir, "hls", assetId);

  try {
    await mkdir(outputRoot, { recursive: true });

    // Download source video
    const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(sourcePath);
    if (dlErr || !blob) throw new Error(dlErr?.message ?? "Failed to download source video");

    await writeFile(inputPath, Buffer.from(await blob.arrayBuffer()));
    console.log(`[transcode-bg] Downloaded source (${((sizeBytes ?? 0) / 1_048_576).toFixed(1)} MB)`);

    // Probe dimensions (uses ffmpeg stderr — ffprobe is not bundled)
    const stream = await probeVideo(ffmpegPath, inputPath);
    const renditions = resolveRenditions(stream);
    console.log(`[transcode-bg] ${stream.width}x${stream.height} → ${renditions.map((r) => r.name).join(", ")}`);

    // Transcode each rendition sequentially (CPU-bound, avoid OOM)
    for (const rendition of renditions) {
      console.log(`[transcode-bg] Transcoding ${rendition.name}...`);
      await transcodeRendition(ffmpegPath, inputPath, outputRoot, rendition);
    }

    // Write master playlist and upload
    await writeMasterPlaylist(outputRoot, renditions, stream);
    await uploadHlsDirectory(supabase, bucket, outputRoot, storageRoot);

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(joinStoragePath(storageRoot, "master.m3u8"));

    const resultPath = joinStoragePath(bucket, storageRoot, "master.m3u8");
    const resultUrl  = urlData.publicUrl;

    await supabase.from("video_transcoding_jobs").update({
      status: "completed",
      result_path: resultPath,
      result_url: resultUrl,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    console.log(`[transcode-bg] Job ${jobId} completed — ${resultUrl}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[transcode-bg] Job ${jobId} failed:`, msg);

    await supabase.from("video_transcoding_jobs").update({
      status: "failed",
      error_message: msg,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
  } finally {
    await rm(tempRoot, { force: true, recursive: true }).catch(() => undefined);
  }

  return { statusCode: 202, body: "" };
};

export { handler };
