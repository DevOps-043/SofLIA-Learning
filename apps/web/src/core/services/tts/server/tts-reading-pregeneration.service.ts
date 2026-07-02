import 'server-only';

import { createHash } from 'crypto';
import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';
import { normalizeContentForRenderer } from '@/lib/course-content';
import {
  canPregenerateReadingContent,
  segmentReadingContent,
} from '@/lib/reading/reading-segmentation';
import { getTTSSynthesisTimeoutMs, TTS_PROMPT_VERSION } from '../shared';
import { createWavFromPcm } from '../audio-format.service';
import { resolveProviderForContext, resolveTTSCacheDescriptor } from '../server.service';
import { normalizeTextForSpeech } from '../tts-text-normalization';
import {
  buildTTSCacheKey,
  getTTSStoragePath,
  putCachedAudio,
  TTS_AUDIO_BUCKET,
} from './tts-cache.service';
import { resolveTTSAudio } from './tts-synthesis.service';

type ReadingAudioJobRow = Database['public']['Tables']['tts_reading_audio_jobs']['Row'];
type ReadingAudioJobInsert = Database['public']['Tables']['tts_reading_audio_jobs']['Insert'];
type ReadingAudioAssetInsert = Database['public']['Tables']['tts_reading_audio_assets']['Insert'];
type AdminClient = ReturnType<typeof createAdminClient>;

export type ReadingAudioSourceType =
  | 'activity_reading'
  | 'material_reading'
  | 'lesson_transcript'
  | 'lesson_summary';

export type ReadingAudioLanguage = 'es' | 'en' | 'pt';

interface EnqueueReadingAudioParams {
  sourceType: ReadingAudioSourceType;
  sourceId: string;
  language?: ReadingAudioLanguage;
  text: string;
  triggerNow?: boolean;
}

export type EnqueueReadingAudioBatchItem = Omit<EnqueueReadingAudioParams, 'triggerNow'>;

const JOBS_TABLE = 'tts_reading_audio_jobs' as const;
const JOB_SELECT_FIELDS =
  'id, source_type, source_id, language, content_hash, source_text, voice, model, prompt_version, segment_count, status, retry_count, next_retry_at, locked_by, locked_until, last_error_code, error_message, processing_started_at, processing_finished_at';
// Lightweight fields for candidate scanning — avoids fetching large source_text for hundreds of rows.
const JOB_SCAN_FIELDS =
  'id, status, retry_count, next_retry_at, locked_until';
const MAX_RETRIES = 3;
const LOCK_MS = 10 * 60 * 1000;
const PROCESS_TIME_BUDGET_BUFFER_MS = 20_000; // 20s overhead margin for DB ops (scan, claim, storage, status updates)
const MIN_TIME_REMAINING_BUFFER_MS = 2_000;
const TIME_BUDGET_DEFER_DELAY_MS = 30_000;
// When the TTS provider rate-limits us, wait this long before retrying the job so
// the per-minute/daily quota window has time to reopen.
const RATE_LIMIT_DEFER_DELAY_MS = 5 * 60 * 1000;
const DEFAULT_PROCESS_LIMIT = 1;
const DEFAULT_READING_DAILY_REQUEST_LIMIT = 90;
const CLAIM_CANDIDATE_LIMIT = 10;
const RETRY_DELAYS_MS = [2, 5, 15].map((minutes) => minutes * 60 * 1000);
const TARGET_ACTIVITY_TYPE = 'reflection';
const processingJobIds = new Set<string>();

class ReadingAudioTimeBudgetExceededError extends Error {
  constructor() {
    super('Tiempo de ejecucion agotado; el job se reintentara en la siguiente corrida.');
    this.name = 'ReadingAudioTimeBudgetExceededError';
  }
}

// Thrown when the TTS provider rate-limits us (HTTP 429). This is NOT a job
// failure: the daily/per-minute quota is exhausted, so we defer the job to retry
// later WITHOUT consuming its retry budget. Lets the queue self-throttle to the
// provider's limits and resume automatically on the next window/day.
class ReadingAudioRateLimitedError extends Error {
  constructor() {
    super('Proveedor TTS con limite de cuota (429); el job se reintentara mas tarde.');
    this.name = 'ReadingAudioRateLimitedError';
  }
}

function isRateLimited(error: unknown): boolean {
  return error instanceof ReadingAudioRateLimitedError;
}

export function computeReadingContentHash(text: string): string {
  return createHash('sha256').update(text.trim()).digest('hex');
}

/**
 * Canonical reading text for a `reading` material. Mirrors exactly what the reader
 * renders (`content_data || material_description`, then normalized), so the hash
 * computed at enqueue time matches the one the manifest computes at resolve time,
 * and the synthesized segments line up 1:1 with the on-screen blocks.
 */
export function extractMaterialReadingText(material: {
  content_data?: unknown;
  material_description?: string | null;
}): string {
  const raw = material.content_data || material.material_description || '';
  return normalizeContentForRenderer(raw);
}

function buildWorkerId(prefix = 'tts-reading-audio'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRetryDelayMs(retryCount: number): number {
  return RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
}

function getDefaultProcessTimeBudgetMs(): number {
  return getTTSSynthesisTimeoutMs() + PROCESS_TIME_BUDGET_BUFFER_MS;
}

function getMinimumTimeRemainingMs(): number {
  return getTTSSynthesisTimeoutMs() + MIN_TIME_REMAINING_BUFFER_MS;
}

function getReadingDailyRequestLimit(): number {
  const raw = Number(process.env.TTS_READING_DAILY_REQUEST_LIMIT || DEFAULT_READING_DAILY_REQUEST_LIMIT);

  if (!Number.isFinite(raw)) {
    return DEFAULT_READING_DAILY_REQUEST_LIMIT;
  }

  // Cap raised to 5000 so bulk backfills (e.g. seeding a whole catalog) can run in
  // a single day when TTS_READING_DAILY_REQUEST_LIMIT is set explicitly. Default
  // (no env var) stays at 90 to respect provider rate limits in normal operation.
  return Math.min(Math.max(Math.trunc(raw), 1), 5000);
}

function getUtcDayStartIso(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

async function countReadingAudioGeneratedToday(supabase: AdminClient): Promise<number> {
  const { count, error } = await supabase
    .from('tts_reading_audio_assets')
    .select('id', { count: 'exact', head: true })
    .gte('generated_at', getUtcDayStartIso());

  if (error) {
    // Return 0 (not the limit) so processing is not blocked by a quota query failure.
    // A failed count means we don't know how many were generated — assume 0 to stay unblocked.
    logger.warn('[tts-reading-pregen] no se pudo consultar cuota diaria TTS; asumiendo 0 generados hoy', error);
    return 0;
  }

  return count ?? 0;
}

function getErrorCode(error: unknown): string {
  if (error instanceof ReadingAudioTimeBudgetExceededError) {
    return 'time_budget_exceeded';
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('rate')) return 'rate_limit';
    return error.name || 'generation_error';
  }
  return 'unknown_error';
}

function hasTimeRemaining(deadlineMs: number | undefined, requiredMs: number): boolean {
  return !deadlineMs || Date.now() + requiredMs <= deadlineMs;
}

function assertTimeRemaining(deadlineMs: number | undefined, requiredMs: number): void {
  if (!hasTimeRemaining(deadlineMs, requiredMs)) {
    throw new ReadingAudioTimeBudgetExceededError();
  }
}

function isTimeBudgetExceeded(error: unknown): boolean {
  return error instanceof ReadingAudioTimeBudgetExceededError;
}

function buildJobInsertRows(items: EnqueueReadingAudioBatchItem[]): ReadingAudioJobInsert[] {
  const nowIso = new Date().toISOString();
  const rows: ReadingAudioJobInsert[] = [];

  for (const item of items) {
    if (!canPregenerateReadingContent(item.text)) continue;

    const descriptor = resolveTTSCacheDescriptor({ text: item.text, context: 'reading' });

    rows.push({
      source_type: item.sourceType,
      source_id: item.sourceId,
      language: item.language ?? 'es',
      content_hash: computeReadingContentHash(item.text),
      source_text: item.text,
      voice: descriptor.voice,
      model: descriptor.model,
      prompt_version: TTS_PROMPT_VERSION,
      status: 'pending',
      retry_count: 0,
      next_retry_at: nowIso,
    });
  }

  return rows;
}

export async function enqueueReadingAudioBatch(items: EnqueueReadingAudioBatchItem[]): Promise<number> {
  try {
    const rows = buildJobInsertRows(items);
    if (rows.length === 0) return 0;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from(JOBS_TABLE)
      .upsert(rows, {
        ignoreDuplicates: true,
        onConflict: 'source_type,source_id,language,content_hash',
      })
      .select('id');

    if (error) {
      logger.warn('[tts-reading-pregen] no se pudo encolar lote', {
        error: error.message,
        rows: rows.length,
      });
      return 0;
    }

    return data?.length ?? 0;
  } catch (error) {
    logger.warn('[tts-reading-pregen] enqueue batch fallo (best-effort)', error);
    return 0;
  }
}

export async function enqueueReadingAudio({
  sourceType,
  sourceId,
  language = 'es',
  text,
  triggerNow = true,
}: EnqueueReadingAudioParams): Promise<boolean> {
  try {
    if (!canPregenerateReadingContent(text)) return false;

    const contentHash = computeReadingContentHash(text);
    const descriptor = resolveTTSCacheDescriptor({ text, context: 'reading' });
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from(JOBS_TABLE)
      .select('id')
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .eq('language', language)
      .eq('content_hash', contentHash)
      .maybeSingle();

    if (existing) return false;

    const { data: inserted, error } = await supabase
      .from(JOBS_TABLE)
      .insert({
        source_type: sourceType,
        source_id: sourceId,
        language,
        content_hash: contentHash,
        source_text: text,
        voice: descriptor.voice,
        model: descriptor.model,
        prompt_version: TTS_PROMPT_VERSION,
        status: 'pending',
        retry_count: 0,
        next_retry_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (error) {
      if (error.code !== '23505') {
        logger.warn('[tts-reading-pregen] no se pudo encolar', {
          sourceType,
          sourceId,
          error: error.message,
        });
      }
      return false;
    }

    if (inserted?.id && triggerNow) {
      triggerReadingAudioGeneration(inserted.id);
    }
    return Boolean(inserted?.id);
  } catch (error) {
    logger.warn('[tts-reading-pregen] enqueue fallo (best-effort)', error);
    return false;
  }
}

export async function enqueueActivityReadingAudio(
  activity: {
    activity_id: string;
    activity_type?: string | null;
    activity_content?: string | null;
  },
  options: { triggerNow?: boolean } = {},
): Promise<void> {
  if (!activity.activity_content) return;
  if (activity.activity_type !== TARGET_ACTIVITY_TYPE) return;

  await enqueueReadingAudio({
    sourceType: 'activity_reading',
    sourceId: activity.activity_id,
    language: 'es',
    text: activity.activity_content,
    triggerNow: options.triggerNow,
  });
}

export async function enqueueMaterialReadingAudio(
  material: {
    material_id: string;
    material_type?: string | null;
    content_data?: unknown;
    material_description?: string | null;
  },
  options: { triggerNow?: boolean } = {},
): Promise<void> {
  if (material.material_type !== 'reading') return;

  const text = extractMaterialReadingText(material);
  if (!text) return;

  await enqueueReadingAudio({
    sourceType: 'material_reading',
    sourceId: material.material_id,
    language: 'es',
    text,
    triggerNow: options.triggerNow,
  });
}

export async function enqueueLessonReadingAudio(
  lessonId: string,
  fields: { transcript_content?: string | null; summary_content?: string | null },
  language: ReadingAudioLanguage = 'es',
  options: { triggerNow?: boolean } = {},
): Promise<void> {
  // Transcripts are intentionally NOT synthesized: they duplicate the lesson video's
  // own audio. Only the summary gets reading audio (reflection activities are queued
  // separately). The `transcript_content` field is kept in the signature for callers.
  if (fields.summary_content) {
    await enqueueReadingAudio({
      sourceType: 'lesson_summary',
      sourceId: lessonId,
      language,
      text: fields.summary_content,
      triggerNow: options.triggerNow,
    });
  }
}

export function triggerReadingAudioGeneration(jobId: string): void {
  if (processingJobIds.has(jobId)) return;
  processingJobIds.add(jobId);
  void processJob(jobId)
    .catch((error) => logger.error('[tts-reading-pregen] error en background', error))
    .finally(() => processingJobIds.delete(jobId));
}

async function claimJob(
  supabase: AdminClient,
  params: { jobId?: string; workerId: string },
): Promise<ReadingAudioJobRow | null> {
  const now = new Date();
  const nowIso = now.toISOString();
  const lockUntilIso = new Date(Date.now() + LOCK_MS).toISOString();

  // Push ALL eligibility filters into SQL so the scan returns only truly claimable
  // rows. Previously the scan pulled up to 500 rows and filtered in JS, then looped
  // atomic claims — that loop could take 30s+ under lock contention. Lightweight
  // fields + tight SQL filters + small limit keep this fast.
  let scanQuery = supabase
    .from(JOBS_TABLE)
    .select(JOB_SCAN_FIELDS)
    .in('status', ['pending', 'generating'])
    .or(`retry_count.is.null,retry_count.lt.${MAX_RETRIES}`)
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
    .order('created_at', { ascending: true })
    .limit(params.jobId ? 1 : CLAIM_CANDIDATE_LIMIT);

  if (params.jobId) {
    scanQuery = scanQuery.eq('id', params.jobId);
  }

  const { data: candidates, error } = await scanQuery;
  if (error) {
    throw new Error(`Error buscando jobs de audio pendientes: ${error.message}`);
  }

  for (const candidate of (candidates || []) as ReadingAudioJobRow[]) {
    // Robust two-step atomic claim. Previously this used a single
    // `.update(...).select().maybeSingle()`, but with supabase-js that combination
    // could LOCK the row yet return null, leaving the job claimed-but-abandoned
    // (stuck in 'generating' forever). We instead (1) UPDATE with a per-candidate
    // unique lock token guarded against concurrent claims, then (2) read the row
    // back by that token to confirm WE own it before processing.
    const lockToken = `${params.workerId}:${candidate.id}`;

    const { error: updateError } = await supabase
      .from(JOBS_TABLE)
      .update({
        status: 'generating',
        locked_by: lockToken,
        locked_until: lockUntilIso,
        processing_started_at: nowIso,
      })
      .eq('id', candidate.id)
      .in('status', ['pending', 'generating'])
      .or(`locked_until.is.null,locked_until.lt.${nowIso}`);

    if (updateError) continue;

    const { data: owned } = await supabase
      .from(JOBS_TABLE)
      .select(JOB_SELECT_FIELDS)
      .eq('id', candidate.id)
      .eq('locked_by', lockToken)
      .maybeSingle();

    if (owned) return owned as ReadingAudioJobRow;
  }

  return null;
}

async function resolveLessonIdForJob(
  supabase: AdminClient,
  job: ReadingAudioJobRow,
): Promise<string | null> {
  if (job.source_type === 'lesson_transcript' || job.source_type === 'lesson_summary') {
    return job.source_id;
  }

  if (job.source_type === 'activity_reading') {
    const { data } = await supabase
      .from('lesson_activities')
      .select('lesson_id')
      .eq('activity_id', job.source_id)
      .maybeSingle();
    return (data as { lesson_id?: string } | null)?.lesson_id ?? null;
  }

  if (job.source_type === 'material_reading') {
    const { data } = await supabase
      .from('lesson_materials')
      .select('lesson_id')
      .eq('material_id', job.source_id)
      .maybeSingle();
    return (data as { lesson_id?: string } | null)?.lesson_id ?? null;
  }

  return null;
}

async function isJobWithinReadingAudioScope(
  supabase: AdminClient,
  job: ReadingAudioJobRow,
): Promise<boolean> {
  // Transcripts duplicate the lesson video's audio — never synthesize them. Any
  // pre-existing transcript job is treated as out of scope and discarded here.
  if (job.source_type === 'lesson_transcript') return false;

  if (job.source_type === 'activity_reading') {
    const { data } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('activity_id', job.source_id)
      .eq('activity_type', TARGET_ACTIVITY_TYPE)
      .maybeSingle();

    return Boolean(data);
  }

  if (job.source_type === 'material_reading') {
    const { data } = await supabase
      .from('lesson_materials')
      .select('material_id')
      .eq('material_id', job.source_id)
      .eq('material_type', 'reading')
      .maybeSingle();

    return Boolean(data);
  }

  return job.source_type === 'lesson_summary';
}

async function deleteOutOfScopeJob(supabase: AdminClient, job: ReadingAudioJobRow): Promise<void> {
  const { error } = await supabase
    .from(JOBS_TABLE)
    .delete()
    .eq('id', job.id);

  if (error) {
    throw new Error(`No se pudo descartar el job TTS fuera de alcance: ${error.message}`);
  }
}

async function upsertReadingAudioAsset(
  supabase: AdminClient,
  asset: ReadingAudioAssetInsert,
): Promise<void> {
  const { error } = await supabase
    .from('tts_reading_audio_assets')
    .upsert(asset, {
      onConflict: 'source_type,source_id,language,content_hash,segment_index',
    });

  if (error) {
    throw new Error(`No se pudo registrar el asset de audio: ${error.message}`);
  }
}

function buildFullReadingSpeechText(content: unknown): string {
  return segmentReadingContent(content)
    .map((segment) => segment.text)
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

// Gemini TTS latency scales steeply with input length: ~230 chars ≈ 11s, but a
// full ~2500-char reading hangs past 120s and times out. We split long readings
// into chunks the model can synthesize quickly, then concatenate the PCM audio.
const MAX_TTS_CHUNK_CHARS = 450;
const WAV_HEADER_BYTES = 44;
// Gemini enforces a requests-per-minute limit. Chunked synthesis fires many calls,
// so we pace them (delay between chunks) and back off + retry on 429/503/502 rather
// than failing the whole job on a transient rate-limit hit.
const INTER_CHUNK_DELAY_MS = 1500;
const CHUNK_RETRY_BACKOFFS_MS = [8000, 20000, 45000, 60000];
const RETRYABLE_TTS_STATUSES = new Set([429, 502, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Splits reading text into chunks of at most maxChars, preferring to break on
 * paragraph then sentence boundaries so each chunk is a natural speech unit.
 * A single sentence longer than maxChars is hard-split as a last resort.
 */
function chunkReadingText(fullText: string, maxChars: number): string[] {
  const trimmed = fullText.trim();
  if (trimmed.length <= maxChars) return [trimmed];

  // Split into sentence-ish units, keeping the delimiter with its sentence.
  const units = trimmed
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((unit) => unit.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const pushHardSplit = (unit: string) => {
    for (let index = 0; index < unit.length; index += maxChars) {
      chunks.push(unit.slice(index, index + maxChars));
    }
  };

  for (const unit of units) {
    if (unit.length > maxChars) {
      if (current) { chunks.push(current); current = ''; }
      pushHardSplit(unit);
      continue;
    }
    const candidate = current ? `${current} ${unit}` : unit;
    if (candidate.length > maxChars) {
      if (current) chunks.push(current);
      current = unit;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

/** Extracts raw PCM from a chunk's audio bytes (strips the WAV header if present). */
function extractPcm(bytes: ArrayBuffer): Uint8Array {
  const view = new Uint8Array(bytes);
  const isWav =
    view.length > WAV_HEADER_BYTES &&
    view[0] === 0x52 && view[1] === 0x49 && view[2] === 0x46 && view[3] === 0x46; // "RIFF"
  return isWav ? view.subarray(WAV_HEADER_BYTES) : view;
}

type ChunkedSynthesisResult =
  | { kind: 'audio'; bytes: ArrayBuffer; contentType: string }
  | { kind: 'error'; status: number; detail: string };

/**
 * Synthesizes reading audio by splitting long text into chunks, synthesizing each
 * (reusing the per-text TTS cache), and concatenating the PCM into a single WAV.
 * Short readings (one chunk) pass through unchanged.
 */
// Tone of the reading narration (ElevenLabs voice_settings). Defaults are tuned for
// clear, professional educational narration; each is overridable via env so the tone
// can be tweaked without code changes.
function getReadingVoiceSettings() {
  const num = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    stability: num(process.env.ELEVENLABS_READING_STABILITY, 0.55),
    similarity_boost: num(process.env.ELEVENLABS_READING_SIMILARITY, 0.75),
    style: num(process.env.ELEVENLABS_READING_STYLE, 0.1),
    use_speaker_boost: true,
  };
}

/** Synthesizes a single chunk, retrying with backoff on transient rate-limit (429) errors. */
async function synthesizeChunkWithRetry(
  text: string,
): Promise<Awaited<ReturnType<typeof resolveTTSAudio>>> {
  const voiceSettings = getReadingVoiceSettings();
  let lastResult = await resolveTTSAudio({ text, context: 'reading', voiceSettings });

  for (let attempt = 0; attempt < CHUNK_RETRY_BACKOFFS_MS.length; attempt += 1) {
    if (lastResult.kind === 'audio') return lastResult;
    if (!RETRYABLE_TTS_STATUSES.has(lastResult.status)) return lastResult;

    const waitMs = CHUNK_RETRY_BACKOFFS_MS[attempt];
    logger.warn('[tts-reading-pregen] chunk con rate-limit, reintentando', {
      status: lastResult.status,
      attempt: attempt + 1,
      waitMs,
    });
    await sleep(waitMs);
    lastResult = await resolveTTSAudio({ text, context: 'reading', voiceSettings });
  }

  return lastResult;
}

async function synthesizeReadingAudio(fullText: string): Promise<ChunkedSynthesisResult> {
  // ElevenLabs synthesizes the whole reading in one request (handles long text and
  // returns MP3, which can't be PCM-concatenated). Chunking is a Gemini-only
  // workaround for its steep latency on long input.
  const provider = resolveProviderForContext('reading');
  if (provider !== 'gemini') {
    const single = await synthesizeChunkWithRetry(fullText);
    if (single.kind === 'error') {
      return { kind: 'error', status: single.status, detail: JSON.stringify(single.body).slice(0, 300) };
    }
    return { kind: 'audio', bytes: single.bytes, contentType: single.contentType };
  }

  const chunks = chunkReadingText(fullText, MAX_TTS_CHUNK_CHARS);

  if (chunks.length === 1) {
    const single = await synthesizeChunkWithRetry(chunks[0]);
    if (single.kind === 'error') {
      return { kind: 'error', status: single.status, detail: JSON.stringify(single.body).slice(0, 300) };
    }
    return { kind: 'audio', bytes: single.bytes, contentType: single.contentType };
  }

  const pcmParts: Uint8Array[] = [];
  let totalPcmLength = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    if (index > 0) await sleep(INTER_CHUNK_DELAY_MS);

    const chunkResult = await synthesizeChunkWithRetry(chunks[index]);
    if (chunkResult.kind === 'error') {
      return {
        kind: 'error',
        status: chunkResult.status,
        detail: `chunk ${index + 1}/${chunks.length} fallo: ${JSON.stringify(chunkResult.body).slice(0, 200)}`,
      };
    }
    const pcm = extractPcm(chunkResult.bytes);
    pcmParts.push(pcm);
    totalPcmLength += pcm.byteLength;
    logger.debug('[tts-reading-pregen] chunk sintetizado', {
      chunk: index + 1,
      total: chunks.length,
      chars: chunks[index].length,
      pcmBytes: pcm.byteLength,
    });
  }

  const combinedPcm = new Uint8Array(totalPcmLength);
  let offset = 0;
  for (const part of pcmParts) {
    combinedPcm.set(part, offset);
    offset += part.byteLength;
  }

  const wav = createWavFromPcm(combinedPcm);
  const out = new ArrayBuffer(wav.byteLength);
  new Uint8Array(out).set(wav);
  return { kind: 'audio', bytes: out, contentType: 'audio/wav' };
}

async function processClaimedJob(
  supabase: AdminClient,
  job: ReadingAudioJobRow,
  options: { deadlineMs?: number } = {},
): Promise<'ready' | 'failed' | 'generating' | 'skipped' | 'deferred'> {
  const tStart = Date.now();
  try {
    if (!(await isJobWithinReadingAudioScope(supabase, job))) {
      await deleteOutOfScopeJob(supabase, job);
      return 'skipped';
    }

    const rawText = buildFullReadingSpeechText(job.source_text);
    if (!rawText) {
      await deleteOutOfScopeJob(supabase, job);
      return 'skipped';
    }
    // Expand acronyms (IA, RRHH, …) to spoken form so the TTS pronounces them naturally.
    const fullText = normalizeTextForSpeech(rawText, job.language);

    const lessonId = await resolveLessonIdForJob(supabase, job);

    assertTimeRemaining(options.deadlineMs, getMinimumTimeRemainingMs());

    const result = await synthesizeReadingAudio(fullText);
    if (result.kind === 'error') {
      // 429 = provider rate/quota limit. Not a job failure: defer and retry later
      // without consuming the retry budget (see catch block).
      if (result.status === 429) {
        throw new ReadingAudioRateLimitedError();
      }
      throw new Error(`Sintesis de audio fallo (status ${result.status}): ${result.detail}`);
    }

    const descriptor = resolveTTSCacheDescriptor({ text: fullText, context: 'reading' });
    // The asset audio is stored under a per-source key, NOT the bare content-addressed
    // cache key. Otherwise two readings with identical text (e.g. a shared summary
    // across lessons) resolve to the same storage_path and the second asset insert
    // violates the unique (bucket, storage_path) constraint. Synthesis cost is still
    // deduped: resolveTTSAudio caches by content, so the twin reading never re-synthesizes.
    const contentCacheKey = buildTTSCacheKey(descriptor, fullText);
    const assetStorageKey = `${contentCacheKey}__${job.source_type}_${job.source_id}_${job.language}`;
    const storagePath = getTTSStoragePath(assetStorageKey);
    const stored = await putCachedAudio(assetStorageKey, result.bytes, result.contentType);
    if (!stored) {
      throw new Error('No se pudo guardar el audio en Supabase Storage.');
    }

    await upsertReadingAudioAsset(supabase, {
      bucket: TTS_AUDIO_BUCKET,
      byte_length: result.bytes.byteLength,
      content_hash: job.content_hash,
      content_type: result.contentType,
      generated_at: new Date().toISOString(),
      job_id: job.id,
      language: job.language,
      lesson_id: lessonId,
      model: descriptor.model,
      prompt_version: TTS_PROMPT_VERSION,
      segment_context: 'reading',
      segment_index: 0,
      source_id: job.source_id,
      source_type: job.source_type,
      storage_path: storagePath,
      voice: descriptor.voice,
    });

    const now = new Date().toISOString();
    // Use only .eq('id') — the locked_by safety check caused silent 0-row updates
    // when locked_by was unexpectedly null, leaving jobs stuck in 'generating'.
    const { error: readyError } = await supabase
      .from(JOBS_TABLE)
      .update({
        status: 'ready',
        segment_count: 1,
        error_message: null,
        last_error_code: null,
        locked_by: null,
        locked_until: null,
        processing_finished_at: now,
      })
      .eq('id', job.id);

    if (readyError) {
      throw new Error(`No se pudo marcar el job TTS como ready: ${readyError.message}`);
    }

    logger.info('[tts-reading-pregen] job listo', {
      jobId: job.id,
      bytes: result.bytes.byteLength,
      totalMs: Date.now() - tStart,
    });
    return 'ready';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido pre-generando audio.';

    // Provider rate/quota limit (429): defer without consuming the retry budget so
    // the queue self-throttles and resumes when the quota window reopens.
    if (isRateLimited(error)) {
      logger.warn('[tts-reading-pregen] job diferido por rate-limit del proveedor', { jobId: job.id });
      const { error: deferError } = await supabase
        .from(JOBS_TABLE)
        .update({
          status: 'pending',
          next_retry_at: new Date(Date.now() + RATE_LIMIT_DEFER_DELAY_MS).toISOString(),
          last_error_code: '429',
          error_message: message,
          locked_by: null,
          locked_until: null,
          processing_finished_at: null,
        })
        .eq('id', job.id);

      if (deferError) {
        logger.error('[tts-reading-pregen] no se pudo diferir job rate-limited', {
          jobId: job.id,
          error: deferError.message,
        });
      }
      return 'deferred';
    }

    logger.error('[tts-reading-pregen] job fallo', {
      jobId: job.id,
      message,
      timeBudgetExceeded: isTimeBudgetExceeded(error),
      totalMs: Date.now() - tStart,
    });

    if (isTimeBudgetExceeded(error)) {
      const now = new Date();
      const { error: deferError } = await supabase
        .from(JOBS_TABLE)
        .update({
          status: 'pending',
          next_retry_at: new Date(now.getTime() + TIME_BUDGET_DEFER_DELAY_MS).toISOString(),
          last_error_code: getErrorCode(error),
          error_message: message,
          locked_by: null,
          locked_until: null,
          processing_finished_at: null,
        })
        .eq('id', job.id);

      if (deferError) {
        logger.error('[TTS] No se pudo diferir el job; quedará bloqueado hasta que expire el lock.', {
          jobId: job.id,
          error: deferError.message,
        });
      }

      return 'deferred';
    }

    const nextRetryCount = (job.retry_count || 0) + 1;
    const shouldFail = nextRetryCount >= MAX_RETRIES;
    const now = new Date();
    const nextRetryAt = shouldFail
      ? now.toISOString()
      : new Date(now.getTime() + getRetryDelayMs(nextRetryCount - 1)).toISOString();

    const { error: retryError } = await supabase
      .from(JOBS_TABLE)
      .update({
        status: shouldFail ? 'failed' : 'pending',
        retry_count: nextRetryCount,
        next_retry_at: nextRetryAt,
        last_error_code: getErrorCode(error),
        error_message: message,
        locked_by: null,
        locked_until: null,
        processing_finished_at: shouldFail ? now.toISOString() : null,
      })
      .eq('id', job.id);

    if (retryError) {
      logger.error('[TTS] No se pudo actualizar el estado de error del job; quedará bloqueado hasta que expire el lock.', {
        jobId: job.id,
        shouldFail,
        error: retryError.message,
      });
    }

    return shouldFail ? 'failed' : 'generating';
  }
}

export async function processJob(jobId: string, workerId = buildWorkerId('direct')): Promise<void> {
  const supabase = createAdminClient();
  const claimed = await claimJob(supabase, { jobId, workerId });
  if (claimed) {
    await processClaimedJob(supabase, claimed);
  }
}

export async function processPendingReadingAudio({
  limit = DEFAULT_PROCESS_LIMIT,
  maxRuntimeMs = getDefaultProcessTimeBudgetMs(),
  workerId = buildWorkerId('cron'),
}: {
  limit?: number;
  maxRuntimeMs?: number;
  workerId?: string;
} = {}): Promise<{
  deferred: number;
  details: Array<{ jobId: string; status: 'ready' | 'failed' | 'generating' | 'skipped' | 'deferred' }>;
  failed: number;
  processed: number;
  quotaLimit: number;
  quotaRemaining: number;
  quotaReached: boolean;
  skipped: number;
  workerId: string;
}> {
  const supabase = createAdminClient();
  const deadlineMs = Date.now() + maxRuntimeMs;
  const details: Array<{ jobId: string; status: 'ready' | 'failed' | 'generating' | 'skipped' | 'deferred' }> = [];
  let deferred = 0;
  let processed = 0;
  let failed = 0;
  let skipped = 0;
  const quotaLimit = getReadingDailyRequestLimit();
  const generatedToday = await countReadingAudioGeneratedToday(supabase);
  const quotaRemaining = Math.max(0, quotaLimit - generatedToday);
  const effectiveLimit = Math.min(Math.max(1, Math.trunc(limit)), DEFAULT_PROCESS_LIMIT, quotaRemaining);

  if (quotaRemaining <= 0) {
    return {
      deferred,
      details,
      failed,
      processed,
      quotaLimit,
      quotaRemaining: 0,
      quotaReached: true,
      skipped,
      workerId,
    };
  }

  for (let index = 0; index < effectiveLimit; index += 1) {
    if (!hasTimeRemaining(deadlineMs, getMinimumTimeRemainingMs())) break;

    const claimed = await claimJob(supabase, { workerId });
    if (!claimed) break;

    const result = await processClaimedJob(supabase, claimed, { deadlineMs });
    processed += 1;
    if (result === 'failed') failed += 1;
    if (result === 'skipped') skipped += 1;
    if (result === 'deferred') deferred += 1;

    details.push({ jobId: claimed.id, status: result });

    if (result === 'deferred') break;
  }

  return {
    deferred,
    details,
    failed,
    processed,
    quotaLimit,
    quotaRemaining: Math.max(0, quotaRemaining - processed),
    quotaReached: quotaRemaining - processed <= 0,
    skipped,
    workerId,
  };
}
