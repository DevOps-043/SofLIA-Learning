/**
 * Notebook Enrichment — Batch Processor (cron)
 *
 * Drains notebook_ai_enrichment_jobs: for each due job it loads the note,
 * asks Gemini for a structured enrichment (JSON validated with Zod), persists
 * notebook_note_metadata and refreshes AI-suggested tasks. Invoked by
 * /api/cron/process-notebook-enrichment (Netlify scheduled function).
 *
 * Cost controls: idempotent jobs by content hash (stale jobs are skipped
 * without calling the model), small batches, one model call per note, capped
 * output tokens. Security: note content is scanned with the platform prompt-
 * injection detector and framed as data inside the prompt; every model use is
 * written to the security audit log.
 */

import 'server-only'

import { GoogleGenerativeAI } from '@google/generative-ai'

import { createAdminClient } from '@/lib/supabase/admin'
import { evaluatePromptInjectionRisk } from '@/lib/security/prompt-injection-detector'
import { writeSecurityAuditLogAsync } from '@/lib/security/security-audit-log'
import { logger } from '@/lib/utils/logger'
import { flexibleFrom } from './notebook-enrichment.server.service'
import {
  buildEnrichmentPrompt,
  clip,
  computeNoteContentHash,
  normalizeAiOutput,
  stripHtmlToText,
  type NormalizedEnrichment,
} from './notebook-enrichment.normalizer'

type AdminClient = ReturnType<typeof createAdminClient>

const FALLBACK_MODEL = 'gemini-3.5-flash'
const MODEL_TIMEOUT_MS = 25_000
const MAX_PROMPT_TEXT_CHARS = 12_000
const PROCESSING_STALE_MINUTES = 15

interface JobRow {
  attempts: number
  content_hash: string
  job_id: string
  max_attempts: number
  note_id: string
  organization_id: string
}

interface NoteRow {
  note_content: string
  note_id: string
  note_tags: unknown
  note_title: string
  organization_id: string | null
  source_type: string | null
  user_id: string
}

interface ExistingMetadataRow {
  lifecycle_status: string
}

interface ExistingTaskTitleRow {
  status: string
  title: string
}

export interface EnrichmentBatchResult {
  done: number
  failed: number
  processed: number
  skipped: number
}

async function generateEnrichment(prompt: string): Promise<NormalizedEnrichment> {
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!googleApiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada.')
  }

  const genAI = new GoogleGenerativeAI(googleApiKey)
  const model = genAI.getGenerativeModel(
    {
      generationConfig: {
        maxOutputTokens: 1_024,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
      model: process.env.GEMINI_MODEL || FALLBACK_MODEL,
    },
    { timeout: MODEL_TIMEOUT_MS },
  )

  const result = await model.generateContent(prompt)
  const rawText = result.response
    .text()
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawText)
  } catch {
    throw new Error('La respuesta del modelo no es JSON valido.')
  }

  return normalizeAiOutput(parsedJson)
}

async function persistMetadata(
  client: AdminClient,
  note: NoteRow,
  enrichment: NormalizedEnrichment,
  contentHash: string,
): Promise<void> {
  // User-owned lifecycle states must survive re-enrichment; only draft
  // (or a brand-new row) moves to 'enriched'.
  const { data: existing } = await flexibleFrom(client, 'notebook_note_metadata')
    .select('lifecycle_status')
    .eq('note_id', note.note_id)
    .maybeSingle<ExistingMetadataRow>()

  const lifecycleStatus =
    existing && existing.lifecycle_status !== 'draft'
      ? existing.lifecycle_status
      : 'enriched'

  const { error } = await flexibleFrom(client, 'notebook_note_metadata')
    .upsert(
      {
        ai_enriched_at: new Date().toISOString(),
        ai_summary: enrichment.summary,
        confidence: enrichment.confidence,
        content_hash: contentHash,
        key_concepts: enrichment.keyConcepts,
        knowledge_type: enrichment.knowledgeType,
        lifecycle_status: lifecycleStatus,
        note_id: note.note_id,
        organization_id: note.organization_id,
        suggested_tags: enrichment.suggestedTags,
        updated_at: new Date().toISOString(),
        user_id: note.user_id,
      },
      { onConflict: 'note_id' },
    )
    .returns<unknown>()

  if (error) {
    throw new Error(`Error guardando metadatos: ${error.message}`)
  }
}

/**
 * Replaces AI-suggested tasks with the fresh detection, without ever touching
 * tasks the user already confirmed/completed/dismissed. Titles that collide
 * (case-insensitive) with an existing non-suggested task are not re-suggested.
 */
async function refreshSuggestedTasks(
  client: AdminClient,
  note: NoteRow,
  detectedTasks: string[],
): Promise<void> {
  const { data: existingTasks } = await flexibleFrom(client, 'notebook_derived_tasks')
    .select('title, status')
    .eq('note_id', note.note_id)
    .returns<ExistingTaskTitleRow[]>()

  const keptTitles = new Set(
    (existingTasks ?? [])
      .filter((task) => task.status !== 'suggested')
      .map((task) => task.title.toLowerCase()),
  )

  const { error: deleteError } = await flexibleFrom(client, 'notebook_derived_tasks')
    .delete()
    .eq('note_id', note.note_id)
    .eq('created_by', 'ai')
    .eq('status', 'suggested')
    .returns<unknown>()

  if (deleteError) {
    throw new Error(`Error limpiando tareas sugeridas: ${deleteError.message}`)
  }

  const rows = detectedTasks
    .filter((title) => !keptTitles.has(title.toLowerCase()))
    .map((title) => ({
      created_by: 'ai',
      note_id: note.note_id,
      organization_id: note.organization_id,
      status: 'suggested',
      title,
      user_id: note.user_id,
    }))

  if (rows.length === 0) return

  const { error: insertError } = await flexibleFrom(client, 'notebook_derived_tasks')
    .insert(rows)
    .returns<unknown>()

  if (insertError) {
    throw new Error(`Error creando tareas sugeridas: ${insertError.message}`)
  }
}

function backoffDate(attempts: number): string {
  const delayMinutes = Math.min(60, Math.max(1, 2 ** attempts))
  return new Date(Date.now() + delayMinutes * 60_000).toISOString()
}

async function markJob(
  client: AdminClient,
  job: JobRow,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await flexibleFrom(client, 'notebook_ai_enrichment_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('job_id', job.job_id)
    .returns<unknown>()

  if (error) {
    logger.error('No se pudo actualizar el job de enriquecimiento', {
      error: error.message,
      jobId: job.job_id,
    })
  }
}

/** Optimistic lock: only one runner may move a job into 'processing'. */
async function claimJob(client: AdminClient, job: JobRow): Promise<boolean> {
  const { data, error } = await flexibleFrom(client, 'notebook_ai_enrichment_jobs')
    .update({
      attempts: job.attempts + 1,
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('job_id', job.job_id)
    .in('status', ['pending', 'failed'])
    .select('job_id')
    .maybeSingle<{ job_id: string }>()

  if (error) throw new Error(error.message)
  return Boolean(data)
}

async function processJob(client: AdminClient, job: JobRow): Promise<'done' | 'skipped'> {
  const { data: note, error } = await flexibleFrom(client, 'user_lesson_notes')
    .select('note_id, note_title, note_content, note_tags, user_id, organization_id, source_type')
    .eq('note_id', job.note_id)
    .maybeSingle<NoteRow>()

  if (error) throw new Error(`Error cargando la nota: ${error.message}`)

  // Note deleted, moved out of an org, or edited since this job was enqueued
  // (a newer job holds the current hash): skip without spending tokens.
  if (!note || !note.organization_id) return 'skipped'
  const currentHash = computeNoteContentHash(note.note_title, note.note_content)
  if (currentHash !== job.content_hash) return 'skipped'

  const noteText = clip(stripHtmlToText(note.note_content), MAX_PROMPT_TEXT_CHARS)

  const risk = evaluatePromptInjectionRisk({ message: noteText })
  if (risk.action === 'block') {
    writeSecurityAuditLogAsync({
      action: 'notebook_enrichment_blocked',
      actorId: note.user_id,
      metadata: { categories: risk.categories, score: risk.score },
      orgId: note.organization_id,
      resourceId: note.note_id,
      resourceType: 'notebook_note',
      result: 'denied',
    })
    return 'skipped'
  }

  const existingTags = Array.isArray(note.note_tags)
    ? note.note_tags.filter((tag): tag is string => typeof tag === 'string')
    : []

  const enrichment = await generateEnrichment(
    buildEnrichmentPrompt({
      existingTags,
      noteText,
      noteTitle: note.note_title,
    }),
  )

  await persistMetadata(client, note, enrichment, job.content_hash)
  await refreshSuggestedTasks(client, note, enrichment.detectedTasks)

  writeSecurityAuditLogAsync({
    action: 'notebook_enrichment_completed',
    actorId: note.user_id,
    metadata: {
      concepts: enrichment.keyConcepts.length,
      knowledgeType: enrichment.knowledgeType,
      tasks: enrichment.detectedTasks.length,
    },
    orgId: note.organization_id,
    resourceId: note.note_id,
    resourceType: 'notebook_note',
    result: 'success',
  })

  return 'done'
}

/** Requeues jobs stuck in 'processing' (crashed runner) after a grace period. */
async function recoverStaleJobs(client: AdminClient): Promise<void> {
  const threshold = new Date(
    Date.now() - PROCESSING_STALE_MINUTES * 60_000,
  ).toISOString()

  const { error } = await flexibleFrom(client, 'notebook_ai_enrichment_jobs')
    .update({
      last_error: 'Recovered stale processing job',
      next_attempt_at: new Date().toISOString(),
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'processing')
    .lt('updated_at', threshold)
    .returns<unknown>()

  if (error) {
    logger.warn('No se pudieron recuperar jobs de enriquecimiento atascados', {
      error: error.message,
    })
  }
}

export async function processNotebookEnrichmentJobs(params: {
  limit: number
  maxRuntimeMs: number
}): Promise<EnrichmentBatchResult> {
  const startedAt = Date.now()
  const client = createAdminClient()
  const result: EnrichmentBatchResult = { done: 0, failed: 0, processed: 0, skipped: 0 }

  await recoverStaleJobs(client)

  const { data: jobs, error } = await flexibleFrom(client, 'notebook_ai_enrichment_jobs')
    .select('job_id, note_id, organization_id, content_hash, attempts, max_attempts')
    .in('status', ['pending', 'failed'])
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(params.limit)
    .returns<JobRow[]>()

  if (error) {
    throw new Error(`Error consultando la cola de enriquecimiento: ${error.message}`)
  }

  for (const job of jobs ?? []) {
    if (Date.now() - startedAt > params.maxRuntimeMs) break

    let claimed: boolean
    try {
      claimed = await claimJob(client, job)
    } catch (claimError) {
      logger.error('No se pudo reclamar el job de enriquecimiento', {
        error: claimError instanceof Error ? claimError.message : claimError,
        jobId: job.job_id,
      })
      continue
    }
    if (!claimed) continue

    result.processed += 1

    try {
      const outcome = await processJob(client, job)
      await markJob(client, job, { last_error: null, status: outcome })
      if (outcome === 'done') result.done += 1
      else result.skipped += 1
    } catch (jobError) {
      const attempts = job.attempts + 1
      const exhausted = attempts >= job.max_attempts
      await markJob(client, job, {
        last_error:
          jobError instanceof Error ? clip(jobError.message, 500) : 'Error desconocido',
        next_attempt_at: exhausted
          ? new Date('9999-12-31T00:00:00.000Z').toISOString()
          : backoffDate(attempts),
        status: 'failed',
      })
      result.failed += 1
      logger.error('Fallo el enriquecimiento de un apunte', {
        error: jobError instanceof Error ? jobError.message : jobError,
        jobId: job.job_id,
        noteId: job.note_id,
      })
    }
  }

  return result
}
