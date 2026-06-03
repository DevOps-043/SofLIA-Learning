import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';
import {
  enqueueReadingAudio,
  processJob,
  processPendingReadingAudio,
  type ReadingAudioLanguage,
  type ReadingAudioSourceType,
} from './tts-reading-pregeneration.service';

type AdminClient = ReturnType<typeof createAdminClient>;

export type ReadingAudioJobStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type ReadingAudioBackfillResource = 'all' | 'activities' | 'lessons';

export interface ReadingAudioJobListParams {
  language?: ReadingAudioLanguage | 'all';
  limit?: number;
  offset?: number;
  sourceType?: ReadingAudioSourceType | 'all';
  status?: ReadingAudioJobStatus | 'all';
}

export interface ReadingAudioBackfillParams {
  allPages?: boolean;
  language?: ReadingAudioLanguage | 'all';
  limit?: number;
  offset?: number;
  resource?: ReadingAudioBackfillResource;
}

interface ContentTranslationRow {
  entity_id: string;
  translations: Json;
}

interface LessonRow {
  lesson_id: string;
  summary_content?: string | null;
  transcript_content?: string | null;
}

interface ActivityRow {
  activity_id: string;
  activity_content?: string | null;
  activity_type?: string | null;
}

const LANGUAGES: ReadingAudioLanguage[] = ['es', 'en', 'pt'];
const TARGET_ACTIVITY_TYPE = 'reflection';
const JOB_LIST_SCAN_LIMIT = 5000;
const MAX_BACKFILL_PAGES = 500;

const JOB_SELECT_FIELDS =
  'id, source_type, source_id, language, content_hash, source_text, voice, model, prompt_version, segment_count, status, retry_count, next_retry_at, locked_by, locked_until, last_error_code, error_message, processing_started_at, processing_finished_at, created_at, updated_at';

type ReadingAudioJobListRow = {
  effective_status: ReadingAudioJobStatus;
  language: string;
  locked_until: string | null;
  source_type: string;
  status: string;
};

type CleanupCandidate = {
  id: string;
  source_id: string;
  source_type: ReadingAudioSourceType;
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function loadCleanupCandidates(supabase: AdminClient): Promise<CleanupCandidate[]> {
  const candidates: CleanupCandidate[] = [];

  for (let page = 0; page < MAX_BACKFILL_PAGES; page += 1) {
    const from = page * JOB_LIST_SCAN_LIMIT;
    const to = from + JOB_LIST_SCAN_LIMIT - 1;
    const { data, error } = await supabase
      .from('tts_reading_audio_jobs')
      .select('id, source_type, source_id')
      .in('source_type', ['activity_reading', 'material_reading'])
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;

    const rows = (data || []) as CleanupCandidate[];
    candidates.push(...rows);
    if (rows.length < JOB_LIST_SCAN_LIMIT) break;
  }

  return candidates;
}

function readTranslations(row: ContentTranslationRow | undefined): Record<string, unknown> {
  const value = row?.translations;
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getTextTranslation(
  row: ContentTranslationRow | undefined,
  key: string,
): string | null {
  const value = readTranslations(row)[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function resolveLanguages(language: ReadingAudioLanguage | 'all' = 'all'): ReadingAudioLanguage[] {
  return language === 'all' ? LANGUAGES : [language];
}

function effectiveJobStatus(job: {
  locked_until: string | null;
  status: string;
}): ReadingAudioJobStatus {
  if (job.status === 'pending' && job.locked_until && new Date(job.locked_until).getTime() > Date.now()) {
    return 'generating';
  }
  if (job.status === 'ready' || job.status === 'failed') return job.status;
  return 'pending';
}

async function loadTranslations(
  supabase: AdminClient,
  entityType: 'activity',
  language: ReadingAudioLanguage,
  entityIds: string[],
): Promise<Map<string, ContentTranslationRow>> {
  if (language === 'es' || entityIds.length === 0) return new Map();

  const { data } = await supabase
    .from('content_translations')
    .select('entity_id, translations')
    .eq('entity_type', entityType)
    .eq('language_code', language)
    .in('entity_id', entityIds);

  return new Map(((data || []) as ContentTranslationRow[]).map((row) => [row.entity_id, row]));
}

async function enqueueActivityBatch(
  supabase: AdminClient,
  language: ReadingAudioLanguage,
  limit: number,
  offset: number,
): Promise<{ scanned: number; queued: number }> {
  const { data, error } = await supabase
    .from('lesson_activities')
    .select('activity_id, activity_type, activity_content')
    .eq('activity_type', TARGET_ACTIVITY_TYPE)
    .not('activity_content', 'is', null)
    .order('activity_id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const activities = (data || []) as ActivityRow[];
  const translations = await loadTranslations(
    supabase,
    'activity',
    language,
    activities.map((activity) => activity.activity_id),
  );

  let queued = 0;
  for (const activity of activities) {
    const text = language === 'es'
      ? activity.activity_content
      : getTextTranslation(translations.get(activity.activity_id), 'activity_content');
    if (!text) continue;
    const inserted = await enqueueReadingAudio({
      sourceType: 'activity_reading',
      sourceId: activity.activity_id,
      language,
      text,
      triggerNow: false,
    });
    if (inserted) queued += 1;
  }

  return { scanned: activities.length, queued };
}

async function loadLessons(
  supabase: AdminClient,
  language: ReadingAudioLanguage,
  limit: number,
  offset: number,
) {
  const table = language === 'en'
    ? 'course_lessons_en'
    : language === 'pt'
      ? 'course_lessons_pt'
      : 'course_lessons';

  return supabase
    .from(table)
    .select('lesson_id, transcript_content, summary_content')
    .order('lesson_id', { ascending: true })
    .range(offset, offset + limit - 1);
}

async function enqueueLessonBatch(
  supabase: AdminClient,
  language: ReadingAudioLanguage,
  limit: number,
  offset: number,
): Promise<{ scanned: number; queued: number }> {
  const { data, error } = await loadLessons(supabase, language, limit, offset);
  if (error) throw error;

  let queued = 0;
  const lessons = (data || []) as LessonRow[];
  for (const lesson of lessons) {
    if (lesson.transcript_content) {
      const inserted = await enqueueReadingAudio({
        sourceType: 'lesson_transcript',
        sourceId: lesson.lesson_id,
        language,
        text: lesson.transcript_content,
        triggerNow: false,
      });
      if (inserted) queued += 1;
    }

    if (lesson.summary_content) {
      const inserted = await enqueueReadingAudio({
        sourceType: 'lesson_summary',
        sourceId: lesson.lesson_id,
        language,
        text: lesson.summary_content,
        triggerNow: false,
      });
      if (inserted) queued += 1;
    }
  }

  return { scanned: lessons.length, queued };
}

export async function backfillReadingAudioJobs({
  allPages = false,
  language = 'all',
  limit = 100,
  offset = 0,
  resource = 'all',
}: ReadingAudioBackfillParams = {}) {
  const initialOffset = offset;
  const supabase = createAdminClient();
  const languages = resolveLanguages(language);
  const resources = resource === 'all'
    ? (['activities', 'lessons'] as const)
    : ([resource] as const);
  const details: Array<{
    language: ReadingAudioLanguage;
    queued: number;
    resource: Exclude<ReadingAudioBackfillResource, 'all'>;
    scanned: number;
  }> = [];
  let pages = 0;
  let hasMore = false;

  do {
    hasMore = false;
    pages += 1;

    for (const currentLanguage of languages) {
      for (const currentResource of resources) {
        const result = currentResource === 'activities'
          ? await enqueueActivityBatch(supabase, currentLanguage, limit, offset)
          : await enqueueLessonBatch(supabase, currentLanguage, limit, offset);

        if (result.scanned === limit) {
          hasMore = true;
        }

        details.push({
          language: currentLanguage,
          queued: result.queued,
          resource: currentResource,
          scanned: result.scanned,
        });
      }
    }

    offset += limit;
  } while (allPages && hasMore && pages < MAX_BACKFILL_PAGES);

  return {
    details,
    hasMore,
    limit,
    nextOffset: offset,
    offset: initialOffset,
    pages,
    queued: details.reduce((sum, detail) => sum + detail.queued, 0),
    scanned: details.reduce((sum, detail) => sum + detail.scanned, 0),
  };
}

export async function listReadingAudioJobs({
  language = 'all',
  limit = 100,
  offset = 0,
  sourceType = 'all',
  status = 'all',
}: ReadingAudioJobListParams = {}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tts_reading_audio_jobs')
    .select(JOB_SELECT_FIELDS)
    .order('created_at', { ascending: false })
    .limit(JOB_LIST_SCAN_LIMIT);

  if (error) throw error;

  const jobs = ((data || []) as Array<Record<string, unknown>>).map((job) => ({
    ...job,
    effective_status: effectiveJobStatus(job as { locked_until: string | null; status: string }),
  })) as Array<Record<string, unknown> & ReadingAudioJobListRow>;

  const filtered = jobs.filter((job) => {
    if (language !== 'all' && job.language !== language) return false;
    if (sourceType !== 'all' && job.source_type !== sourceType) return false;
    if (status !== 'all' && job.effective_status !== status) return false;
    return true;
  });

  const summary: Record<ReadingAudioJobStatus, number> = {
    failed: 0,
    generating: 0,
    pending: 0,
    ready: 0,
  };
  for (const job of jobs) {
    summary[job.effective_status as ReadingAudioJobStatus] += 1;
  }

  return {
    jobs: filtered.slice(offset, offset + limit),
    pagination: { limit, offset },
    summary,
    total: filtered.length,
  };
}

export async function drainReadingAudioQueue(limit: number) {
  return processPendingReadingAudio({ limit });
}

export async function reprocessReadingAudioJob(jobId: string) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('tts_reading_audio_jobs')
    .update({
      error_message: null,
      last_error_code: null,
      locked_by: null,
      locked_until: null,
      next_retry_at: now,
      processing_finished_at: null,
      retry_count: 0,
      status: 'pending',
    })
    .eq('id', jobId);

  if (error) throw error;
  await processJob(jobId, `admin-${Date.now()}`);
}

export async function retryFailedReadingAudioJobs(limit: number) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('tts_reading_audio_jobs')
    .select('id')
    .eq('status', 'failed')
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  const ids = (data || []).map((row) => row.id);
  if (ids.length === 0) return { requeued: 0 };

  const { error: updateError } = await supabase
    .from('tts_reading_audio_jobs')
    .update({
      error_message: null,
      last_error_code: null,
      locked_by: null,
      locked_until: null,
      next_retry_at: now,
      processing_finished_at: null,
      retry_count: 0,
      status: 'pending',
    })
    .in('id', ids);

  if (updateError) throw updateError;
  return { requeued: ids.length };
}

export async function cleanupNonTargetReadingAudioJobs() {
  const supabase = createAdminClient();
  const candidates = await loadCleanupCandidates(supabase);
  const activityJobs = candidates.filter((job) => job.source_type === 'activity_reading');
  const materialJobs = candidates.filter((job) => job.source_type === 'material_reading');
  const activityIds = activityJobs.map((job) => job.source_id);
  const reflectionIds = new Set<string>();

  for (const chunk of chunkArray(activityIds, 500)) {
    if (chunk.length === 0) continue;
    const { data: reflections, error: reflectionError } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('activity_type', TARGET_ACTIVITY_TYPE)
      .in('activity_id', chunk);

    if (reflectionError) throw reflectionError;
    for (const reflection of reflections || []) {
      reflectionIds.add(reflection.activity_id);
    }
  }

  const nonTargetActivityJobs = activityJobs.filter((job) => !reflectionIds.has(job.source_id));
  const deleteJobs = [...materialJobs, ...nonTargetActivityJobs];
  const jobIds = deleteJobs.map((job) => job.id);
  const materialSourceIds = materialJobs.map((job) => job.source_id);
  const activitySourceIds = nonTargetActivityJobs.map((job) => job.source_id);

  let deletedAssets = 0;
  let deletedProgress = 0;
  const storagePaths: string[] = [];

  async function collectAndDeleteAssets(sourceType: ReadingAudioSourceType, sourceIds: string[]) {
    for (const chunk of chunkArray(sourceIds, 500)) {
      if (chunk.length === 0) continue;
      const { data: assets, error: assetReadError } = await supabase
        .from('tts_reading_audio_assets')
        .select('storage_path')
        .eq('source_type', sourceType)
        .in('source_id', chunk);

      if (assetReadError) throw assetReadError;
      storagePaths.push(...(assets || []).map((asset) => asset.storage_path).filter(Boolean));

      const { count, error: assetDeleteError } = await supabase
        .from('tts_reading_audio_assets')
        .delete({ count: 'exact' })
        .eq('source_type', sourceType)
        .in('source_id', chunk);

      if (assetDeleteError) throw assetDeleteError;
      deletedAssets += count || 0;
    }
  }

  async function deleteProgress(sourceType: ReadingAudioSourceType, sourceIds: string[]) {
    for (const chunk of chunkArray(sourceIds, 500)) {
      if (chunk.length === 0) continue;
      const { count, error: progressDeleteError } = await supabase
        .from('user_reading_audio_progress')
        .delete({ count: 'exact' })
        .eq('source_type', sourceType)
        .in('source_id', chunk);

      if (progressDeleteError) throw progressDeleteError;
      deletedProgress += count || 0;
    }
  }

  await collectAndDeleteAssets('material_reading', materialSourceIds);
  await collectAndDeleteAssets('activity_reading', activitySourceIds);
  await deleteProgress('material_reading', materialSourceIds);
  await deleteProgress('activity_reading', activitySourceIds);

  let deletedJobs = 0;
  for (const chunk of chunkArray(jobIds, 500)) {
    if (chunk.length === 0) continue;
    const { count, error: deleteError } = await supabase
      .from('tts_reading_audio_jobs')
      .delete({ count: 'exact' })
      .in('id', chunk);

    if (deleteError) throw deleteError;
    deletedJobs += count || 0;
  }

  for (const chunk of chunkArray(Array.from(new Set(storagePaths)), 500)) {
    if (chunk.length === 0) continue;
    await supabase.storage.from('tts-audio').remove(chunk);
  }

  return {
    deletedAssets,
    deletedJobs,
    deletedProgress,
    deletedStorageObjects: new Set(storagePaths).size,
    scanned: candidates.length,
  };
}
