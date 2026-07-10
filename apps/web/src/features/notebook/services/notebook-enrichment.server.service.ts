/**
 * Notebook Enrichment — Server Service
 *
 * Enqueueing and read/update access for the AI enrichment layer
 * (notebook_note_metadata, notebook_ai_enrichment_jobs, notebook_derived_tasks).
 * All operations are scoped to (userId, organizationId), mirroring
 * notebook.server.service.ts. Enrichment itself runs asynchronously in
 * notebook-enrichment.processor.server.ts (cron).
 *
 * The new tables are not in the generated Supabase types yet (migration not
 * applied remotely); access goes through the same flexible-builder pattern
 * used by lesson-auto-note.service.ts until `npm run gen:types` picks them up.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { NotebookError } from './notebook.server.service'
import {
  computeNoteContentHash,
  stripHtmlToText,
} from './notebook-enrichment.normalizer'
import type {
  NotebookDerivedTask,
  NotebookDerivedTaskStatus,
  NotebookEnrichmentReviewInput,
  NotebookEnrichmentJobStatus,
  NotebookNoteEnrichment,
  NotebookNoteEnrichmentState,
} from '../types'

type AdminClient = ReturnType<typeof createAdminClient>

/** Minimal structural facade over PostgREST for tables missing in gen types. */
export interface FlexibleQueryResult<T> {
  data: T | null
  error: { code?: string; message: string } | null
}

export interface FlexibleBuilder {
  delete(): FlexibleBuilder
  eq(column: string, value: unknown): FlexibleBuilder
  in(column: string, values: readonly unknown[]): FlexibleBuilder
  insert(values: unknown): FlexibleBuilder
  is(column: string, value: unknown): FlexibleBuilder
  limit(count: number): FlexibleBuilder
  lt(column: string, value: unknown): FlexibleBuilder
  lte(column: string, value: unknown): FlexibleBuilder
  maybeSingle<T>(): PromiseLike<FlexibleQueryResult<T>>
  order(column: string, options?: { ascending?: boolean }): FlexibleBuilder
  returns<T>(): PromiseLike<FlexibleQueryResult<T>>
  select(columns?: string): FlexibleBuilder
  single<T>(): PromiseLike<FlexibleQueryResult<T>>
  update(values: unknown): FlexibleBuilder
  upsert(values: unknown, options?: { onConflict?: string; ignoreDuplicates?: boolean }): FlexibleBuilder
}

export function flexibleFrom(client: AdminClient, table: string): FlexibleBuilder {
  return (client as unknown as { from(table: string): FlexibleBuilder }).from(table)
}

/** Notes below this plain-text length are not worth an AI call. */
const MIN_ENRICHABLE_TEXT_LENGTH = 80

interface MetadataRow {
  note_id: string
  knowledge_type: string
  lifecycle_status: string
  ai_summary: string | null
  key_concepts: unknown
  suggested_tags: unknown
  confidence: number | string | null
  ai_enriched_at: string | null
}

interface TaskRow {
  task_id: string
  note_id: string
  title: string
  status: string
  created_by: string
  created_at: string
  completed_at: string | null
}

interface JobStatusRow {
  status: string
  attempts: number
  max_attempts: number
}

interface JobIdRow {
  job_id: string
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function toEnrichment(row: MetadataRow): NotebookNoteEnrichment {
  const confidence =
    row.confidence === null || row.confidence === undefined
      ? null
      : Number(row.confidence)
  return {
    noteId: row.note_id,
    knowledgeType: row.knowledge_type as NotebookNoteEnrichment['knowledgeType'],
    lifecycleStatus:
      row.lifecycle_status as NotebookNoteEnrichment['lifecycleStatus'],
    summary: row.ai_summary,
    keyConcepts: toStringArray(row.key_concepts),
    suggestedTags: toStringArray(row.suggested_tags),
    confidence: confidence !== null && Number.isFinite(confidence) ? confidence : null,
    enrichedAt: row.ai_enriched_at,
  }
}

function toTask(row: TaskRow): NotebookDerivedTask {
  return {
    taskId: row.task_id,
    noteId: row.note_id,
    title: row.title,
    status: row.status as NotebookDerivedTaskStatus,
    createdBy: row.created_by === 'user' ? 'user' : 'ai',
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

/**
 * Enqueues an AI enrichment job for a note. Fire-and-forget from note
 * create/update: a failure here must never break the save, so callers use
 * `void enqueueNoteEnrichment(...)` and errors are only logged.
 *
 * Skips: compendiums (already an AI synthesis) and near-empty notes.
 * Idempotent: UNIQUE(note_id, content_hash, job_type) + ignoreDuplicates.
 */
export async function enqueueNoteEnrichment(params: {
  client?: AdminClient
  noteId: string
  userId: string
  organizationId: string
  title: string
  contentHtml: string
  sourceType: string
}): Promise<void> {
  try {
    if (params.sourceType === 'course_compendium') return
    if (stripHtmlToText(params.contentHtml).length < MIN_ENRICHABLE_TEXT_LENGTH) {
      return
    }

    const client = params.client ?? createAdminClient()
    const contentHash = computeNoteContentHash(params.title, params.contentHtml)

    const { error } = await flexibleFrom(client, 'notebook_ai_enrichment_jobs')
      .upsert(
        {
          content_hash: contentHash,
          job_type: 'enrich',
          note_id: params.noteId,
          organization_id: params.organizationId,
        },
        { onConflict: 'note_id,content_hash,job_type', ignoreDuplicates: true },
      )
      .returns<unknown>()

    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    logger.warn('No se pudo encolar el enriquecimiento del apunte', {
      error: error instanceof Error ? error.message : error,
      noteId: params.noteId,
    })
  }
}

/** Verifies the note belongs to (userId, organizationId); throws 404 if not. */
async function assertNoteOwnership(
  client: AdminClient,
  params: { noteId: string; userId: string; organizationId: string },
): Promise<void> {
  const { data, error } = await client
    .from('user_lesson_notes')
    .select('note_id')
    .eq('note_id', params.noteId)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Error al validar la nota: ${error.message}`)
  }
  if (!data) {
    throw new NotebookError('Nota no encontrada.', 404)
  }
}

/**
 * Returns the enrichment state of a note: metadata (or null while pending),
 * derived tasks, and the aggregated queue status so the UI knows whether to
 * keep polling.
 */
export async function fetchNoteEnrichmentState(params: {
  noteId: string
  userId: string
  organizationId: string
}): Promise<NotebookNoteEnrichmentState> {
  const client = createAdminClient()
  await assertNoteOwnership(client, params)

  const [metadataResult, tasksResult, jobResult] = await Promise.all([
    flexibleFrom(client, 'notebook_note_metadata')
      .select(
        'note_id, knowledge_type, lifecycle_status, ai_summary, key_concepts, suggested_tags, confidence, ai_enriched_at',
      )
      .eq('note_id', params.noteId)
      .maybeSingle<MetadataRow>(),
    flexibleFrom(client, 'notebook_derived_tasks')
      .select('task_id, note_id, title, status, created_by, created_at, completed_at')
      .eq('note_id', params.noteId)
      .order('created_at', { ascending: true })
      .limit(50)
      .returns<TaskRow[]>(),
    flexibleFrom(client, 'notebook_ai_enrichment_jobs')
      .select('status, attempts, max_attempts')
      .eq('note_id', params.noteId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<JobStatusRow>(),
  ])

  if (metadataResult.error) {
    throw new Error(
      `Error al obtener el enriquecimiento: ${metadataResult.error.message}`,
    )
  }
  if (tasksResult.error) {
    throw new Error(`Error al obtener las tareas: ${tasksResult.error.message}`)
  }

  let jobStatus: NotebookEnrichmentJobStatus = 'idle'
  const job = jobResult.error ? null : jobResult.data
  if (job) {
    if (job.status === 'pending') jobStatus = 'pending'
    else if (job.status === 'processing') jobStatus = 'processing'
    else if (job.status === 'failed') {
      // Still retrying = pending from the user's point of view.
      jobStatus = job.attempts >= job.max_attempts ? 'failed' : 'pending'
    }
  }

  return {
    enrichment: metadataResult.data ? toEnrichment(metadataResult.data) : null,
    tasks: (tasksResult.data ?? []).map(toTask),
    jobStatus,
  }
}

/** Accepts, edits or dismisses AI suggestions without changing note content. */
export async function reviewNoteEnrichment(params: {
  input: NotebookEnrichmentReviewInput
  noteId: string
  organizationId: string
  userId: string
}): Promise<NotebookNoteEnrichmentState> {
  const client = createAdminClient()
  await assertNoteOwnership(client, params)

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (params.input.action === 'dismiss') {
    Object.assign(update, {
      ai_summary: null,
      confidence: null,
      key_concepts: [],
      lifecycle_status: 'draft',
      suggested_tags: [],
    })
  } else {
    update.lifecycle_status = 'reviewed'
    if (params.input.action === 'edit' && params.input.overrides) {
      const overrides = params.input.overrides
      if (overrides.summary !== undefined) update.ai_summary = overrides.summary
      if (overrides.keyConcepts !== undefined) {
        update.key_concepts = overrides.keyConcepts
      }
      if (overrides.suggestedTags !== undefined) {
        update.suggested_tags = overrides.suggestedTags
      }
      if (overrides.knowledgeType !== undefined) {
        update.knowledge_type = overrides.knowledgeType
      }
    }
  }

  const { data, error } = await flexibleFrom(client, 'notebook_note_metadata')
    .update(update)
    .eq('note_id', params.noteId)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .select('note_id')
    .maybeSingle<{ note_id: string }>()

  if (error) {
    throw new Error(`Error al revisar el enriquecimiento: ${error.message}`)
  }
  if (!data) {
    throw new NotebookError('El apunte aún no tiene sugerencias para revisar.', 404)
  }

  return fetchNoteEnrichmentState(params)
}

/** Resets (or creates) the idempotent job for the note's current content. */
export async function retryNoteEnrichment(params: {
  noteId: string
  organizationId: string
  userId: string
}): Promise<NotebookNoteEnrichmentState> {
  const client = createAdminClient()
  const { data: note, error: noteError } = await client
    .from('user_lesson_notes')
    .select('note_id, note_title, note_content, source_type')
    .eq('note_id', params.noteId)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .maybeSingle()

  if (noteError) {
    throw new Error(`Error al validar la nota: ${noteError.message}`)
  }
  if (!note) {
    throw new NotebookError('Nota no encontrada.', 404)
  }
  if (note.source_type === 'course_compendium') {
    throw new NotebookError('El compendio no requiere enriquecimiento.', 422)
  }
  if (stripHtmlToText(note.note_content).length < MIN_ENRICHABLE_TEXT_LENGTH) {
    throw new NotebookError(
      'La nota necesita más contenido antes de poder enriquecerla.',
      422,
    )
  }

  const contentHash = computeNoteContentHash(note.note_title, note.note_content)
  const now = new Date().toISOString()
  const { data: resetJob, error: resetError } = await flexibleFrom(
    client,
    'notebook_ai_enrichment_jobs',
  )
    .update({
      attempts: 0,
      last_error: null,
      next_attempt_at: now,
      status: 'pending',
      updated_at: now,
    })
    .eq('note_id', params.noteId)
    .eq('content_hash', contentHash)
    .eq('job_type', 'enrich')
    .select('job_id')
    .maybeSingle<JobIdRow>()

  if (resetError) {
    throw new Error(`Error al reintentar el enriquecimiento: ${resetError.message}`)
  }

  if (!resetJob) {
    const { error: insertError } = await flexibleFrom(
      client,
      'notebook_ai_enrichment_jobs',
    )
      .insert({
        content_hash: contentHash,
        job_type: 'enrich',
        note_id: params.noteId,
        organization_id: params.organizationId,
        status: 'pending',
      })
      .select('job_id')
      .maybeSingle<JobIdRow>()

    if (insertError) {
      throw new Error(
        `Error al encolar el enriquecimiento: ${insertError.message}`,
      )
    }
  }

  return fetchNoteEnrichmentState(params)
}

/**
 * Updates the status of a derived task owned by the user in this org.
 * Users can confirm ('open'), complete ('done'), reopen or dismiss — but a
 * task can never be reset to 'suggested' (that state belongs to the AI).
 */
export async function updateDerivedTaskStatus(params: {
  taskId: string
  userId: string
  organizationId: string
  status: Exclude<NotebookDerivedTaskStatus, 'suggested'>
}): Promise<NotebookDerivedTask> {
  const client = createAdminClient()

  const { data, error } = await flexibleFrom(client, 'notebook_derived_tasks')
    .update({
      completed_at: params.status === 'done' ? new Date().toISOString() : null,
      status: params.status,
      updated_at: new Date().toISOString(),
    })
    .eq('task_id', params.taskId)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .select('task_id, note_id, title, status, created_by, created_at, completed_at')
    .maybeSingle<TaskRow>()

  if (error) {
    throw new Error(`Error al actualizar la tarea: ${error.message}`)
  }
  if (!data) {
    throw new NotebookError('Tarea no encontrada.', 404)
  }

  return toTask(data)
}
