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
import { resolveTTSAudio } from './tts-synthesis.service';

type ReadingAudioJobRow = Database['public']['Tables']['tts_reading_audio_jobs']['Row'];
type AdminClient = ReturnType<typeof createAdminClient>;

export type ReadingAudioSourceType =
  | 'activity_reading'
  | 'lesson_transcript'
  | 'lesson_summary';

export type ReadingAudioLanguage = 'es' | 'en' | 'pt';

interface EnqueueReadingAudioParams {
  sourceType: ReadingAudioSourceType;
  sourceId: string;
  language?: ReadingAudioLanguage;
  text: string;
  /**
   * Dispara el procesamiento inmediato en background (default true). El backfill
   * masivo usa `false` para evitar thundering herd: el cron drena los pendientes.
   */
  triggerNow?: boolean;
}

const JOBS_TABLE = 'tts_reading_audio_jobs' as const;
const JOB_SELECT_FIELDS =
  'id, source_type, source_id, language, content_hash, source_text, voice, model, prompt_version, segment_count, status, retry_count, next_retry_at, locked_by, locked_until, last_error_code, error_message, processing_started_at, processing_finished_at';
const MAX_RETRIES = 3;
const LOCK_MS = 10 * 60 * 1000;
const RETRY_DELAYS_MS = [2, 5, 15].map((minutes) => minutes * 60 * 1000);
const processingJobIds = new Set<string>();

function computeContentHash(text: string): string {
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

/**
 * Encola la pre-generación del audio de una lectura. Idempotente por
 * (fuente, idioma, hash de contenido): si el contenido no cambió, no reencola.
 * Solo aplica a contenido plano/markdown (el HTML se locuta on-demand).
 * Best-effort: nunca lanza (no debe romper el guardado del contenido).
 */
export async function enqueueReadingAudio({
  sourceType,
  sourceId,
  language = 'es',
  text,
  triggerNow = true,
}: EnqueueReadingAudioParams): Promise<void> {
  try {
    if (!canPregenerateReadingContent(text)) {
      return;
    }

    const contentHash = computeContentHash(text);
    const descriptor = resolveTTSCacheDescriptor({ text, context: 'reading' });
    const supabase = createAdminClient();

    // Idempotencia: si ya existe un job para esta versión de contenido (mismo
    // hash), no hacemos nada (no reseteamos su estado/reintentos).
    const { data: existing } = await supabase
      .from(JOBS_TABLE)
      .select('id')
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .eq('language', language)
      .eq('content_hash', contentHash)
      .maybeSingle();

    if (existing) {
      return;
    }

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
      // 23505 = violación de UNIQUE: otro proceso lo encoló en paralelo → OK.
      if (error.code !== '23505') {
        logger.warn('[tts-reading-pregen] no se pudo encolar', { sourceType, sourceId, error: error.message });
      }
      return;
    }

    if (inserted?.id && triggerNow) {
      triggerReadingAudioGeneration(inserted.id);
    }
  } catch (error) {
    logger.warn('[tts-reading-pregen] enqueue falló (best-effort)', error);
  }
}

// Tipos de actividad que NO son lecturas (no tienen contenido para locutar).
const NON_READING_ACTIVITY_TYPES = new Set(['quiz', 'ai_chat']);

/**
 * Encola (best-effort) la pre-generación de audio para una actividad de lectura.
 * Se llama tras crear/editar una actividad en admin. Filtra tipos sin lectura y
 * delega el resto de validaciones (vacío/HTML) a `enqueueReadingAudio`.
 */
export async function enqueueActivityReadingAudio(
  activity: {
    activity_id: string;
    activity_type?: string | null;
    activity_content?: string | null;
  },
  options: { triggerNow?: boolean } = {},
): Promise<void> {
  if (!activity.activity_content) return;
  if (activity.activity_type && NON_READING_ACTIVITY_TYPES.has(activity.activity_type)) return;

  await enqueueReadingAudio({
    sourceType: 'activity_reading',
    sourceId: activity.activity_id,
    language: 'es',
    text: activity.activity_content,
    triggerNow: options.triggerNow,
  });
}

/**
 * Encola (best-effort) la pre-generación de audio para la transcripción y/o el
 * resumen de una lección. Se llama tras crear/editar la lección en admin.
 */
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

/** Dispara el procesamiento en background (best-effort; el cron es el respaldo fiable). */
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

    if (claimed) {
      return claimed as ReadingAudioJobRow;
    }
  }

  return null;
}

async function processClaimedJob(supabase: AdminClient, job: ReadingAudioJobRow): Promise<'ready' | 'failed' | 'generating'> {
  try {
    const segments = segmentReadingContent(job.source_text);
    const requests = buildReadingSpeechRequests(segments).filter((request) => request.text.length > 0);

    // Sintetiza y cachea cada segmento (resolveTTSAudio persiste en el bucket).
    for (const request of requests) {
      const result = await resolveTTSAudio({ text: request.text, context: request.context });
      if (result.kind === 'error') {
        throw new Error(`Síntesis de segmento falló (status ${result.status})`);
      }
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

/** Procesa un job concreto (disparo inmediato tras encolar). */
export async function processJob(jobId: string, workerId = buildWorkerId('direct')): Promise<void> {
  const supabase = createAdminClient();
  const claimed = await claimJob(supabase, { jobId, workerId });
  if (claimed) {
    await processClaimedJob(supabase, claimed);
  }
}

/** Procesa hasta `limit` jobs pendientes (cron de Netlify). */
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
