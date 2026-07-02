import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';
import {
  enqueueReadingAudioBatch,
  extractMaterialReadingText,
  processPendingReadingAudio,
  type ReadingAudioLanguage,
  type ReadingAudioSourceType,
} from './tts-reading-pregeneration.service';

type AdminClient = ReturnType<typeof createAdminClient>;

export type ReadingAudioJobStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type ReadingAudioBackfillResource = 'all' | 'activities' | 'lessons' | 'materials';

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

interface MaterialRow {
  material_id: string;
  material_type?: string | null;
  content_data?: unknown;
  material_description?: string | null;
}

const LANGUAGES: ReadingAudioLanguage[] = ['es', 'en', 'pt'];
const TARGET_ACTIVITY_TYPE = 'reflection';
const JOB_LIST_SCAN_LIMIT = 5000;
const MAX_BACKFILL_PAGES = 500;
const MANUAL_DRAIN_SCAN_MULTIPLIER = 5;
const MANUAL_DRAIN_MIN_SCAN_LIMIT = 500;
const MANUAL_DRAIN_MAX_RETRIES = 3;
const MANUAL_DRAIN_LIMIT = 1;

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

type DrainPreparationCandidate = {
  id: string;
  retry_count: number | null;
  status: string;
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
  const isActivelyLocked = Boolean(
    job.locked_until && new Date(job.locked_until).getTime() > Date.now(),
  );

  if ((job.status === 'pending' || job.status === 'generating') && isActivelyLocked) {
    return 'generating';
  }
  if (job.status === 'ready' || job.status === 'failed') return job.status;
  return 'pending';
}

function isDrainPreparationCandidateRecoverable(job: DrainPreparationCandidate): boolean {
  if (job.status === 'ready' || job.status === 'failed') return false;
  if ((job.retry_count ?? 0) >= MANUAL_DRAIN_MAX_RETRIES) return false;
  return true;
}

async function prepareReadingAudioQueueForManualDrain(limit: number) {
  const supabase = createAdminClient();
  const now = new Date();
  const scanLimit = Math.max(
    MANUAL_DRAIN_MIN_SCAN_LIMIT,
    limit * MANUAL_DRAIN_SCAN_MULTIPLIER,
  );

  const { data, error } = await supabase
    .from('tts_reading_audio_jobs')
    .select('id, status, retry_count')
    .not('status', 'eq', 'ready')
    .not('status', 'eq', 'failed')
    .order('created_at', { ascending: true })
    .limit(scanLimit);

  if (error) throw error;

  const candidates = ((data || []) as DrainPreparationCandidate[])
    .filter((job) => isDrainPreparationCandidateRecoverable(job))
    .slice(0, limit);
  const ids = candidates.map((job) => job.id);

  if (ids.length === 0) {
    return { prepared: 0, scanned: (data || []).length };
  }

  const { data: preparedRows, error: updateError } = await supabase
    .from('tts_reading_audio_jobs')
    .update({
      locked_by: null,
      locked_until: null,
      next_retry_at: now.toISOString(),
      processing_finished_at: null,
      processing_started_at: null,
      status: 'pending',
    })
    .in('id', ids)
    .not('status', 'eq', 'ready')
    .not('status', 'eq', 'failed')
    .select('id');

  if (updateError) throw updateError;

  return {
    prepared: preparedRows?.length ?? 0,
    scanned: (data || []).length,
  };
}

async function loadTranslations(
  supabase: AdminClient,
  entityType: 'activity' | 'material',
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

  const items: Array<{
    language: ReadingAudioLanguage;
    sourceId: string;
    sourceType: 'activity_reading';
    text: string;
  }> = [];

  for (const activity of activities) {
    const text = language === 'es'
      ? activity.activity_content
      : getTextTranslation(translations.get(activity.activity_id), 'activity_content');
    if (!text) continue;
    items.push({
      sourceType: 'activity_reading',
      sourceId: activity.activity_id,
      language,
      text,
    });
  }

  const queued = await enqueueReadingAudioBatch(items);

  return { scanned: activities.length, queued };
}

async function enqueueMaterialBatch(
  supabase: AdminClient,
  language: ReadingAudioLanguage,
  limit: number,
  offset: number,
): Promise<{ scanned: number; queued: number }> {
  const { data, error } = await supabase
    .from('lesson_materials')
    .select('material_id, material_type, content_data, material_description')
    .eq('material_type', 'reading')
    .order('material_id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const materials = (data || []) as MaterialRow[];
  const translations = await loadTranslations(
    supabase,
    'material',
    language,
    materials.map((material) => material.material_id),
  );

  const items: Array<{
    language: ReadingAudioLanguage;
    sourceId: string;
    sourceType: 'material_reading';
    text: string;
  }> = [];

  for (const material of materials) {
    const text = language === 'es'
      ? extractMaterialReadingText(material)
      : extractMaterialReadingText({
          content_data: getTextTranslation(translations.get(material.material_id), 'content_data'),
          material_description: getTextTranslation(
            translations.get(material.material_id),
            'material_description',
          ),
        });
    if (!text) continue;
    items.push({
      sourceType: 'material_reading',
      sourceId: material.material_id,
      language,
      text,
    });
  }

  const queued = await enqueueReadingAudioBatch(items);

  return { scanned: materials.length, queued };
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
  const items: Array<{
    language: ReadingAudioLanguage;
    sourceId: string;
    sourceType: 'lesson_summary';
    text: string;
  }> = [];

  for (const lesson of lessons) {
    // Transcripts are excluded on purpose: they are verbatim the lesson video's
    // audio, so synthesizing TTS for them duplicates content and wastes quota.
    // Only summaries (and reflection activities elsewhere) get reading audio.
    if (lesson.summary_content) {
      items.push({
        sourceType: 'lesson_summary',
        sourceId: lesson.lesson_id,
        language,
        text: lesson.summary_content,
      });
    }
  }

  queued = await enqueueReadingAudioBatch(items);

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
    ? (['activities', 'lessons', 'materials'] as const)
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
          : currentResource === 'materials'
            ? await enqueueMaterialBatch(supabase, currentLanguage, limit, offset)
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
  const drainLimit = Math.min(Math.max(1, Math.trunc(limit)), MANUAL_DRAIN_LIMIT);
  const preparation = await prepareReadingAudioQueueForManualDrain(drainLimit);
  const result = await processPendingReadingAudio({
    limit: drainLimit,
    workerId: `admin-tts-drain-${Date.now()}`,
  });

  return {
    ...result,
    prepared: preparation.prepared,
    scannedForPreparation: preparation.scanned,
  };
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

/**
 * Resets ALL jobs stuck in 'generating' status back to 'pending' with retry_count = 0.
 *
 * Jobs become stuck when the post-generation status update fails silently (now fixed),
 * leaving them in 'generating' with retry_count >= MAX_RETRIES — invisible to the
 * normal cron and drain. This function force-unblocks them regardless of retry count.
 */
export async function resetStuckGeneratingJobs(limit = 500) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Reset both:
  // 1. Jobs with status='generating' (failed silent status update — core bug)
  // 2. Jobs with status='pending' AND locked_by IS NOT NULL (orphaned lock from aborted processing)
  // Both appear as "GENERANDO" in the UI via computeEffectiveJobStatus.
  const { data, error } = await supabase
    .from('tts_reading_audio_jobs')
    .select('id')
    .in('status', ['generating', 'pending'])
    .not('locked_by', 'is', null)
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  const ids = (data || []).map((row) => row.id);
  if (ids.length === 0) return { reset: 0 };

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
  return { reset: ids.length };
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

  // Reading materials are now a valid audio source. Only jobs whose material was
  // deleted or is no longer `material_type='reading'` are out of scope and purged —
  // mirroring the reflection check applied to activities above.
  const materialIds = materialJobs.map((job) => job.source_id);
  const readingMaterialIds = new Set<string>();

  for (const chunk of chunkArray(materialIds, 500)) {
    if (chunk.length === 0) continue;
    const { data: readings, error: readingError } = await supabase
      .from('lesson_materials')
      .select('material_id')
      .eq('material_type', 'reading')
      .in('material_id', chunk);

    if (readingError) throw readingError;
    for (const reading of readings || []) {
      readingMaterialIds.add(reading.material_id);
    }
  }

  const nonTargetActivityJobs = activityJobs.filter((job) => !reflectionIds.has(job.source_id));
  const nonTargetMaterialJobs = materialJobs.filter((job) => !readingMaterialIds.has(job.source_id));
  const deleteJobs = [...nonTargetMaterialJobs, ...nonTargetActivityJobs];
  const jobIds = deleteJobs.map((job) => job.id);
  const materialSourceIds = nonTargetMaterialJobs.map((job) => job.source_id);
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
