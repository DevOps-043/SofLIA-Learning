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

const JOBS_TABLE = 'tts_reading_audio_jobs' as const;
const JOB_SELECT_FIELDS =
  'id, source_type, source_id, language, content_hash, source_text, voice, model, prompt_version, segment_count, status, retry_count, next_retry_at, locked_by, locked_until, last_error_code, error_message, processing_started_at, processing_finished_at';
const MAX_RETRIES = 3;
const LOCK_MS = 10 * 60 * 1000;
const RETRY_DELAYS_MS = [2, 5, 15].map((minutes) => minutes * 60 * 1000);
const TARGET_ACTIVITY_TYPE = 'reflection';
const processingJobIds = new Set<string>();

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
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('rate')) return 'rate_limit';
    return error.name || 'generation_error';
  }
  return 'unknown_error';
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
): Promise<'ready' | 'failed' | 'generating' | 'skipped'> {
  try {
    if (!(await isJobWithinReadingAudioScope(supabase, job))) {
      await deleteOutOfScopeJob(supabase, job);
      return 'skipped';
    }

    const segments = segmentReadingContent(job.source_text);
    const requests = buildReadingSpeechRequests(segments).filter((request) => request.text.length > 0);
    const lessonId = await resolveLessonIdForJob(supabase, job);

    for (const request of requests) {
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
  workerId = buildWorkerId('cron'),
}: { limit?: number; workerId?: string } = {}): Promise<{ processed: number; failed: number }> {
  const supabase = createAdminClient();
  let processed = 0;
  let failed = 0;

  for (let index = 0; index < limit; index += 1) {
    const claimed = await claimJob(supabase, { workerId });
    if (!claimed) break;
    const result = await processClaimedJob(supabase, claimed);
    processed += 1;
    if (result === 'failed') failed += 1;
  }

  return { processed, failed };
}
