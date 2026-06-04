import 'server-only';

import { createHash } from 'crypto';
import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';
import {
  buildReadingSpeechRequests,
  canPregenerateReadingContent,
  segmentReadingContent,
} from '@/lib/reading/reading-segmentation';
import { TTS_PROMPT_VERSION } from '../shared';
import { resolveTTSCacheDescriptor } from '../server.service';
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
const MAX_RETRIES = 3;
const LOCK_MS = 10 * 60 * 1000;
const DEFAULT_PROCESS_TIME_BUDGET_MS = 85_000;
const MIN_TIME_REMAINING_TO_CLAIM_MS = 65_000;
const MIN_TIME_REMAINING_TO_START_SEGMENT_MS = 65_000;
const TIME_BUDGET_DEFER_DELAY_MS = 30_000;
const RETRY_DELAYS_MS = [2, 5, 15].map((minutes) => minutes * 60 * 1000);
const TARGET_ACTIVITY_TYPE = 'reflection';
const processingJobIds = new Set<string>();

class ReadingAudioTimeBudgetExceededError extends Error {
  constructor() {
    super('Tiempo de ejecucion agotado; el job se reintentara en la siguiente corrida.');
    this.name = 'ReadingAudioTimeBudgetExceededError';
  }
}

export function computeReadingContentHash(text: string): string {
  return createHash('sha256').update(text.trim()).digest('hex');
}

function buildWorkerId(prefix = 'tts-reading-audio'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRetryDelayMs(retryCount: number): number {
  return RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
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
    if (item.sourceType === 'material_reading') continue;
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
    if (sourceType === 'material_reading') return false;
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

export async function enqueueLessonReadingAudio(
  lessonId: string,
  fields: { transcript_content?: string | null; summary_content?: string | null },
  language: ReadingAudioLanguage = 'es',
  options: { triggerNow?: boolean } = {},
): Promise<void> {
  if (fields.transcript_content) {
    await enqueueReadingAudio({
      sourceType: 'lesson_transcript',
      sourceId: lessonId,
      language,
      text: fields.transcript_content,
      triggerNow: options.triggerNow,
    });
  }

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
  const nowIso = new Date().toISOString();
  const lockUntilIso = new Date(Date.now() + LOCK_MS).toISOString();

  let query = supabase
    .from(JOBS_TABLE)
    .select(JOB_SELECT_FIELDS)
    .eq('status', 'pending')
    .lte('next_retry_at', nowIso)
    .lt('retry_count', MAX_RETRIES)
    .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
    .order('created_at', { ascending: true })
    .limit(10);

  if (params.jobId) {
    query = query.eq('id', params.jobId);
  }

  const { data: candidates, error } = await query;
  if (error) {
    throw new Error(`Error buscando jobs de audio pendientes: ${error.message}`);
  }

  for (const candidate of (candidates || []) as ReadingAudioJobRow[]) {
    const { data: claimed } = await supabase
      .from(JOBS_TABLE)
      .update({
        locked_by: params.workerId,
        locked_until: lockUntilIso,
        processing_started_at: nowIso,
      })
      .eq('id', candidate.id)
      .eq('status', 'pending')
      .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
      .select(JOB_SELECT_FIELDS)
      .maybeSingle();

    if (claimed) return claimed as ReadingAudioJobRow;
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
  if (job.source_type === 'material_reading') return false;

  if (job.source_type === 'activity_reading') {
    const { data } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('activity_id', job.source_id)
      .eq('activity_type', TARGET_ACTIVITY_TYPE)
      .maybeSingle();

    return Boolean(data);
  }

  return job.source_type === 'lesson_transcript' || job.source_type === 'lesson_summary';
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

async function processClaimedJob(
  supabase: AdminClient,
  job: ReadingAudioJobRow,
  options: { deadlineMs?: number } = {},
): Promise<'ready' | 'failed' | 'generating' | 'skipped' | 'deferred'> {
  try {
    if (!(await isJobWithinReadingAudioScope(supabase, job))) {
      await deleteOutOfScopeJob(supabase, job);
      return 'skipped';
    }

    const segments = segmentReadingContent(job.source_text);
    const requests = buildReadingSpeechRequests(segments).filter((request) => request.text.length > 0);
    const lessonId = await resolveLessonIdForJob(supabase, job);

    for (const request of requests) {
      assertTimeRemaining(options.deadlineMs, MIN_TIME_REMAINING_TO_START_SEGMENT_MS);

      const result = await resolveTTSAudio({ text: request.text, context: request.context });
      if (result.kind === 'error') {
        throw new Error(`Sintesis de segmento fallo (status ${result.status})`);
      }

      const descriptor = resolveTTSCacheDescriptor({ text: request.text, context: request.context });
      const cacheKey = buildTTSCacheKey(descriptor, request.text);
      const storagePath = getTTSStoragePath(cacheKey);
      const stored = await putCachedAudio(cacheKey, result.bytes, result.contentType);
      if (!stored && result.cacheStatus !== 'hit') {
        throw new Error('No se pudo guardar el audio en Supabase Storage.');
      }

      await upsertReadingAudioAsset(supabase, {
        bucket: TTS_AUDIO_BUCKET,
        byte_length: result.bytes.byteLength,
        content_hash: job.content_hash,
        content_type: result.contentType,
        job_id: job.id,
        language: job.language,
        lesson_id: lessonId,
        model: descriptor.model,
        prompt_version: TTS_PROMPT_VERSION,
        segment_context: request.context,
        segment_index: request.index,
        source_id: job.source_id,
        source_type: job.source_type,
        storage_path: storagePath,
        voice: descriptor.voice,
      });
    }

    const now = new Date().toISOString();
    await supabase
      .from(JOBS_TABLE)
      .update({
        status: 'ready',
        segment_count: requests.length,
        error_message: null,
        last_error_code: null,
        locked_by: null,
        locked_until: null,
        processing_finished_at: now,
      })
      .eq('id', job.id)
      .eq('locked_by', job.locked_by ?? '');

    return 'ready';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido pre-generando audio.';

    if (isTimeBudgetExceeded(error)) {
      const now = new Date();
      await supabase
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
        .eq('id', job.id)
        .eq('locked_by', job.locked_by ?? '');

      return 'deferred';
    }

    const nextRetryCount = (job.retry_count || 0) + 1;
    const shouldFail = nextRetryCount >= MAX_RETRIES;
    const now = new Date();
    const nextRetryAt = shouldFail
      ? now.toISOString()
      : new Date(now.getTime() + getRetryDelayMs(nextRetryCount - 1)).toISOString();

    await supabase
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
      .eq('id', job.id)
      .eq('locked_by', job.locked_by ?? '');

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
  limit = 5,
  maxRuntimeMs = DEFAULT_PROCESS_TIME_BUDGET_MS,
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

  for (let index = 0; index < limit; index += 1) {
    if (!hasTimeRemaining(deadlineMs, MIN_TIME_REMAINING_TO_CLAIM_MS)) break;

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

  return { deferred, details, failed, processed, skipped, workerId };
}
