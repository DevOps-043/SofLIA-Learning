import 'server-only';

import { createHash } from 'crypto';

import {
  normalizeReadableAudioLanguage,
  normalizeReadableText,
  splitReadableText,
  type ReadableAudioLanguage,
  type ReadableAudioSourceKind,
} from '@/core/services/tts/readable-audio';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { TextToSpeechRequestPayload } from '../types';
import { resolveTTSCacheDescriptor } from '../server.service';
import {
  buildTTSCacheKey,
  getCachedAudioByStoragePath,
  getTTSStoragePath,
} from './tts-cache.service';
import { resolveTTSAudio } from './tts-synthesis.service';

export type TTSAudioAssetStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface ReadableAudioSourceInput {
  sourceKind: ReadableAudioSourceKind;
  sourceId: string;
  language?: string | null;
  text: unknown;
}

export interface ReadableAudioManifestSegment {
  cacheKey: string;
  status: TTSAudioAssetStatus;
  segmentIndex: number;
  segmentCount: number;
  textLength: number;
  charStart: number;
  charEnd: number;
  audioUrl: string;
}

export interface ReadableAudioManifest {
  sourceKind: ReadableAudioSourceKind;
  sourceId: string;
  language: ReadableAudioLanguage;
  contentHash: string;
  textLength: number;
  status: 'empty' | 'queued' | 'partial' | 'ready' | 'failed';
  segments: ReadableAudioManifestSegment[];
}

interface TTSAudioAssetRow {
  id: string;
  source_kind: ReadableAudioSourceKind;
  source_id: string;
  language: ReadableAudioLanguage;
  content_hash: string;
  segment_index: number;
  segment_count: number;
  segment_text: string;
  cache_key: string;
  provider: string;
  model: string;
  voice: string;
  context: 'reading' | 'reading_continuation';
  storage_path: string;
  content_type: string | null;
  byte_size: number | null;
  status: TTSAudioAssetStatus;
  attempts: number;
  error_code: string | null;
  error_message: string | null;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

interface BackfillResult {
  sources: number;
  segments: number;
  emptySources: number;
}

interface ProcessResult {
  processed: number;
  ready: number;
  failed: number;
}

const MAX_ATTEMPTS = 3;
const LOCK_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PROCESS_LIMIT = 5;

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function buildSegmentAudioUrl(cacheKey: string): string {
  return `/api/tts/readable-audio/${encodeURIComponent(cacheKey)}`;
}

function readLimit(value?: number | null): number {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return DEFAULT_PROCESS_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(value as number), 1), 10);
}

function buildPayloadFromRow(row: TTSAudioAssetRow): TextToSpeechRequestPayload {
  return {
    text: row.segment_text,
    context: row.context,
  };
}

function buildManifestStatus(rows: TTSAudioAssetRow[]): ReadableAudioManifest['status'] {
  if (rows.length === 0) {
    return 'empty';
  }

  if (rows.every((row) => row.status === 'ready')) {
    return 'ready';
  }

  if (rows.some((row) => row.status === 'ready')) {
    return 'partial';
  }

  if (rows.every((row) => row.status === 'failed')) {
    return 'failed';
  }

  return 'queued';
}

function rowsToManifest(params: {
  source: ReadableAudioSourceInput;
  language: ReadableAudioLanguage;
  contentHash: string;
  textLength: number;
  rows: TTSAudioAssetRow[];
}): ReadableAudioManifest {
  const sortedRows = [...params.rows].sort((left, right) => left.segment_index - right.segment_index);
  let charStart = 0;

  return {
    sourceKind: params.source.sourceKind,
    sourceId: params.source.sourceId,
    language: params.language,
    contentHash: params.contentHash,
    textLength: params.textLength,
    status: buildManifestStatus(sortedRows),
    segments: sortedRows.map((row) => {
      const textLength = row.segment_text.length;
      const segment: ReadableAudioManifestSegment = {
        cacheKey: row.cache_key,
        status: row.status,
        segmentIndex: row.segment_index,
        segmentCount: row.segment_count,
        textLength,
        charStart,
        charEnd: charStart + textLength,
        audioUrl: buildSegmentAudioUrl(row.cache_key),
      };
      charStart += textLength;
      return segment;
    }),
  };
}

async function fetchRowsByContent(params: {
  sourceKind: ReadableAudioSourceKind;
  sourceId: string;
  language: ReadableAudioLanguage;
  contentHash: string;
}): Promise<TTSAudioAssetRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tts_audio_assets' as never)
    .select('*')
    .eq('source_kind' as never, params.sourceKind as never)
    .eq('source_id' as never, params.sourceId as never)
    .eq('language' as never, params.language as never)
    .eq('content_hash' as never, params.contentHash as never)
    .order('segment_index' as never, { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as unknown as TTSAudioAssetRow[];
}

async function upsertRows(rows: Array<Record<string, unknown>>): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('tts_audio_assets' as never)
    .upsert(rows as never, {
      onConflict: 'source_kind,source_id,language,content_hash,segment_index',
    } as never);

  if (error) {
    throw error;
  }
}

export async function ensureReadableAudioManifest(
  source: ReadableAudioSourceInput,
): Promise<ReadableAudioManifest> {
  const language = normalizeReadableAudioLanguage(source.language);
  const text = normalizeReadableText(source.text);

  if (!text) {
    return {
      sourceKind: source.sourceKind,
      sourceId: source.sourceId,
      language,
      contentHash: hashText(''),
      textLength: 0,
      status: 'empty',
      segments: [],
    };
  }

  const chunks = splitReadableText(text);
  const contentHash = hashText(text);
  const rows = chunks.map((segmentText, index) => {
    const context = index === 0 ? 'reading' : 'reading_continuation';
    const descriptor = resolveTTSCacheDescriptor({ text: segmentText, context });
    const cacheKey = buildTTSCacheKey(descriptor, segmentText);

    return {
      source_kind: source.sourceKind,
      source_id: source.sourceId,
      language,
      content_hash: contentHash,
      segment_index: index,
      segment_count: chunks.length,
      segment_text: segmentText,
      cache_key: cacheKey,
      provider: descriptor.provider,
      model: descriptor.model,
      voice: descriptor.voice,
      context,
      storage_path: getTTSStoragePath(cacheKey),
      status: 'queued',
    };
  });

  await upsertRows(rows);
  const storedRows = await fetchRowsByContent({
    sourceKind: source.sourceKind,
    sourceId: source.sourceId,
    language,
    contentHash,
  });

  return rowsToManifest({
    source,
    language,
    contentHash,
    textLength: text.length,
    rows: storedRows,
  });
}

export async function resolveReadableAudioSegment(cacheKey: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tts_audio_assets' as never)
    .select('*')
    .eq('cache_key' as never, cacheKey as never)
    .single();

  if (error || !data) {
    return {
      kind: 'error' as const,
      status: 404,
      body: { error: 'Audio segment not found', code: 'TTS_AUDIO_SEGMENT_NOT_FOUND' },
    };
  }

  return processAssetRow(data as unknown as TTSAudioAssetRow);
}

async function processAssetRow(row: TTSAudioAssetRow) {
  const cached = await getCachedAudioByStoragePath(row.storage_path);
  if (cached) {
    await markAssetReady(row.id, cached.contentType, cached.bytes.byteLength);
    return {
      kind: 'audio' as const,
      bytes: cached.bytes,
      contentType: cached.contentType,
      cacheStatus: 'hit' as const,
    };
  }

  const result = await resolveTTSAudio(buildPayloadFromRow(row));

  if (result.kind === 'error') {
    await markAssetFailed(row.id, result.body.code, result.body.error);
    return result;
  }

  await markAssetReady(row.id, result.contentType, result.bytes.byteLength);

  return {
    ...result,
    cacheStatus: result.cacheStatus === 'bypass' ? 'miss' : result.cacheStatus,
  };
}

async function markAssetReady(id: string, contentType: string, byteSize: number): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from('tts_audio_assets' as never)
    .update({
      status: 'ready',
      content_type: contentType,
      byte_size: byteSize,
      locked_until: null,
      error_code: null,
      error_message: null,
      processed_at: new Date().toISOString(),
    } as never)
    .eq('id' as never, id as never);
}

async function markAssetFailed(id: string, code: unknown, message: unknown): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from('tts_audio_assets' as never)
    .update({
      status: 'failed',
      locked_until: null,
      error_code: typeof code === 'string' ? code : 'TTS_SYNTHESIS_FAILED',
      error_message: typeof message === 'string' ? message.slice(0, 500) : 'Unable to synthesize audio',
    } as never)
    .eq('id' as never, id as never);
}

async function claimAsset(row: TTSAudioAssetRow): Promise<TTSAudioAssetRow | null> {
  const supabase = createAdminClient();
  const lockUntil = new Date(Date.now() + LOCK_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from('tts_audio_assets' as never)
    .update({
      status: 'processing',
      attempts: row.attempts + 1,
      locked_until: lockUntil,
    } as never)
    .eq('id' as never, row.id as never)
    .neq('status' as never, 'ready' as never)
    .select('*')
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as TTSAudioAssetRow;
}

export async function processPendingReadableAudioAssets(params: {
  limit?: number;
} = {}): Promise<ProcessResult> {
  const limit = readLimit(params.limit);
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('tts_audio_assets' as never)
    .select('*')
    .in('status' as never, ['queued', 'failed'] as never)
    .lt('attempts' as never, MAX_ATTEMPTS as never)
    .or(`locked_until.is.null,locked_until.lt.${now}` as never)
    .order('created_at' as never, { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  const queuedRows = (data || []) as unknown as TTSAudioAssetRow[];
  let processed = 0;
  let ready = 0;
  let failed = 0;

  for (const row of queuedRows) {
    const claimed = await claimAsset(row);
    if (!claimed) {
      continue;
    }

    processed += 1;
    const result = await processAssetRow(claimed);
    if (result.kind === 'audio') {
      ready += 1;
    } else {
      failed += 1;
    }
  }

  return { processed, ready, failed };
}

export async function getReadableAudioStatus() {
  const supabase = createAdminClient();
  const statuses: TTSAudioAssetStatus[] = ['queued', 'processing', 'ready', 'failed'];
  const counts: Record<TTSAudioAssetStatus, number> = {
    queued: 0,
    processing: 0,
    ready: 0,
    failed: 0,
  };

  await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from('tts_audio_assets' as never)
        .select('id', { count: 'exact', head: true })
        .eq('status' as never, status as never);

      if (error) {
        logger.warn('Unable to count TTS audio assets', { status, error });
        return;
      }

      counts[status] = count || 0;
    }),
  );

  return counts;
}

export async function enqueueReadableAudioBackfill(): Promise<BackfillResult> {
  const supabase = createAdminClient();
  const result: BackfillResult = { sources: 0, segments: 0, emptySources: 0 };

  const sources = await loadBackfillSources(supabase);
  for (const source of sources) {
    const manifest = await ensureReadableAudioManifest(source);
    if (manifest.status === 'empty') {
      result.emptySources += 1;
      continue;
    }

    result.sources += 1;
    result.segments += manifest.segments.length;
  }

  return result;
}

async function loadBackfillSources(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<ReadableAudioSourceInput[]> {
  const sources: ReadableAudioSourceInput[] = [];
  const lessonTables: Array<{ table: string; language: ReadableAudioLanguage }> = [
    { table: 'course_lessons', language: 'es' },
    { table: 'course_lessons_en', language: 'en' },
    { table: 'course_lessons_pt', language: 'pt' },
  ];

  for (const { table, language } of lessonTables) {
    const { data } = await supabase
      .from(table as never)
      .select('lesson_id, lesson_description, transcript_content, summary_content');
    const rows = (data || []) as unknown as Array<{
      lesson_id: string;
      lesson_description: string | null;
      transcript_content: string | null;
      summary_content: string | null;
    }>;

    for (const row of rows) {
      sources.push(
        {
          sourceKind: 'lesson_description',
          sourceId: row.lesson_id,
          language,
          text: row.lesson_description,
        },
        {
          sourceKind: 'lesson_transcript',
          sourceId: row.lesson_id,
          language,
          text: row.transcript_content,
        },
        {
          sourceKind: 'lesson_summary',
          sourceId: row.lesson_id,
          language,
          text: row.summary_content,
        },
      );
    }
  }

  const { data: activities } = await supabase
    .from('lesson_activities' as never)
    .select('activity_id, activity_type, activity_content')
    .in('activity_type' as never, ['reading', 'reflection'] as never);
  const activityRows = (activities || []) as unknown as Array<{
    activity_id: string;
    activity_type: string;
    activity_content: unknown;
  }>;

  for (const row of activityRows) {
    sources.push({
      sourceKind: row.activity_type === 'reflection' ? 'activity_reflection' : 'activity_reading',
      sourceId: row.activity_id,
      language: 'es',
      text: row.activity_content,
    });
  }

  const { data: materials } = await supabase
    .from('lesson_materials' as never)
    .select('material_id, material_type, material_description, content_data')
    .eq('material_type' as never, 'reading' as never);
  const materialRows = (materials || []) as unknown as Array<{
    material_id: string;
    material_description: string | null;
    content_data: unknown;
  }>;

  for (const row of materialRows) {
    sources.push({
      sourceKind: 'material_reading',
      sourceId: row.material_id,
      language: 'es',
      text: row.content_data || row.material_description,
    });
  }

  return sources;
}
