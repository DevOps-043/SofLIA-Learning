import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import {
  flexibleFrom,
  type FlexibleQueryResult,
} from './flexible-supabase.server'

import {
  computeNotebookGenerationSourceHash,
  resolveGenerationState,
  resolveQueuedJobState,
} from './notebook-generation.helpers'
import type {
  GenerationState,
  NotebookArtifactEvidenceInput,
  NotebookArtifactStatus,
  NotebookGeneratedArtifact,
  NotebookGeneratedArtifactRow,
  NotebookGenerationJob,
  NotebookGenerationJobRow,
  NotebookGenerationJobType,
} from './notebook-generation.types'

type AdminClient = ReturnType<typeof createAdminClient>

function flexibleRpc<T>(
  client: AdminClient,
  name: string,
  args: Record<string, unknown>,
): PromiseLike<FlexibleQueryResult<T>> {
  return (
    client as unknown as {
      rpc(
        functionName: string,
        parameters: Record<string, unknown>,
      ): PromiseLike<FlexibleQueryResult<T>>
    }
  ).rpc(name, args)
}

export type {
  GenerationState,
  NotebookArtifactEvidenceInput,
  NotebookArtifactStatus,
  NotebookGenerationJob,
  NotebookGenerationJobType,
} from './notebook-generation.types'

function mapJob(row: NotebookGenerationJobRow): NotebookGenerationJob {
  return {
    attempts: row.attempts,
    courseId: row.course_id,
    createdAt: row.created_at,
    enrollmentId: row.enrollment_id,
    finishedAt: row.finished_at,
    jobId: row.job_id,
    jobType: row.job_type as NotebookGenerationJobType,
    lastError: row.last_error,
    leaseExpiresAt: row.lease_expires_at,
    lessonId: row.lesson_id,
    lockedBy: row.locked_by,
    maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at,
    noteId: row.note_id,
    organizationId: row.organization_id,
    priority: row.priority,
    sourceHash: row.source_hash,
    status: row.status as NotebookGenerationJob['status'],
    updatedAt: row.updated_at,
    userId: row.user_id,
  }
}

function mapArtifact(
  row: NotebookGeneratedArtifactRow,
): NotebookGeneratedArtifact {
  return {
    artifactId: row.artifact_id,
    generatedAt: row.generated_at,
    lastError: row.last_error,
    missingArtifacts: row.missing_artifacts,
    noteId: row.note_id,
    sourceHash: row.source_hash,
    status: row.status as NotebookGeneratedArtifact['status'],
    structuredSummary: row.structured_summary,
    updatedAt: row.updated_at,
  }
}

interface EnqueueBaseInput {
  client?: AdminClient
  courseId: string
  enrollmentId: string
  maxAttempts?: number
  organizationId: string
  priority?: number
  sourceHash?: string
  sourceVersion?: string
  userId: string
}

export interface EnqueueNotebookGenerationJobInput extends EnqueueBaseInput {
  jobType: NotebookGenerationJobType
  lessonId: string | null
}

export async function enqueueNotebookGenerationJob(
  input: EnqueueNotebookGenerationJobInput,
): Promise<NotebookGenerationJob> {
  const client = input.client ?? createAdminClient()
  const sourceHash =
    input.sourceHash ||
    computeNotebookGenerationSourceHash({
      courseId: input.courseId,
      enrollmentId: input.enrollmentId,
      jobType: input.jobType,
      lessonId: input.lessonId,
      sourceVersion: input.sourceVersion,
      userId: input.userId,
    })

  const { data, error } = await flexibleRpc<NotebookGenerationJobRow>(client, 'enqueue_notebook_generation_job', {
    p_course_id: input.courseId,
    p_enrollment_id: input.enrollmentId,
    p_job_type: input.jobType,
    p_lesson_id: input.lessonId,
    p_max_attempts: input.maxAttempts ?? 3,
    p_organization_id: input.organizationId,
    p_priority: input.priority ?? 100,
    p_source_hash: sourceHash,
    p_user_id: input.userId,
  })

  if (error || !data) {
    throw new Error(
      `No se pudo encolar la generacion del cuaderno: ${error?.message || 'sin respuesta'}`,
    )
  }

  return mapJob(data as NotebookGenerationJobRow)
}

export function enqueueLessonAutoNoteJob(
  input: EnqueueBaseInput & { lessonId: string },
): Promise<NotebookGenerationJob> {
  return enqueueNotebookGenerationJob({
    ...input,
    jobType: 'lesson_auto_note',
    lessonId: input.lessonId,
  })
}

export function enqueueCourseCompendiumJob(
  input: EnqueueBaseInput,
): Promise<NotebookGenerationJob> {
  return enqueueNotebookGenerationJob({
    ...input,
    jobType: 'course_compendium',
    lessonId: null,
  })
}

export interface EnqueueCourseCompletionNotebookJobsResult {
  compendium: {
    job: NotebookGenerationJob
    state: GenerationState
  }
  lessons: Array<{
    job: NotebookGenerationJob
    state: GenerationState
  }>
}

/**
 * Durable replacement for the former fire-and-forget course completion side
 * effect. Only completed lessons are enqueued; the lower lesson priority makes
 * them claimable before the course compendium.
 */
export async function enqueueCourseCompletionNotebookJobs(input: {
  client?: AdminClient
  courseId: string
  enrollmentId: string
  organizationId: string
  sourceVersion?: string
  userId: string
}): Promise<EnqueueCourseCompletionNotebookJobsResult> {
  const client = input.client ?? createAdminClient()
  const { data: modules, error: modulesError } = await client
    .from('course_modules')
    .select('module_id')
    .eq('course_id', input.courseId)

  if (modulesError) {
    throw new Error(`No se pudieron resolver los modulos: ${modulesError.message}`)
  }

  const moduleIds = (modules || []).map((module) => module.module_id)
  const lessonsResult =
    moduleIds.length > 0
      ? await client
          .from('course_lessons')
          .select('lesson_id, updated_at')
          .in('module_id', moduleIds)
          .order('lesson_order_index', { ascending: true })
      : { data: [], error: null }
  if (lessonsResult.error) {
    throw new Error(
      `No se pudieron resolver las lecciones: ${lessonsResult.error.message}`,
    )
  }

  const lessonIds = (lessonsResult.data || []).map((lesson) => lesson.lesson_id)
  const progressResult =
    lessonIds.length > 0
      ? await client
          .from('user_lesson_progress')
          .select('lesson_id, completed_at, updated_at')
          .eq('user_id', input.userId)
          .eq('enrollment_id', input.enrollmentId)
          .eq('organization_id', input.organizationId)
          .eq('is_completed', true)
          .in('lesson_id', lessonIds)
      : { data: [], error: null }
  if (progressResult.error) {
    throw new Error(
      `No se pudo resolver el progreso completado: ${progressResult.error.message}`,
    )
  }

  const lessonUpdatedAt = new Map(
    (lessonsResult.data || []).map((lesson) => [lesson.lesson_id, lesson.updated_at]),
  )
  const completedProgress = [...(progressResult.data || [])].sort((a, b) =>
    a.lesson_id.localeCompare(b.lesson_id),
  )

  const lessonJobs = await Promise.all(
    completedProgress.map((progress) =>
      enqueueLessonAutoNoteJob({
        client,
        courseId: input.courseId,
        enrollmentId: input.enrollmentId,
        lessonId: progress.lesson_id,
        organizationId: input.organizationId,
        priority: 50,
        sourceVersion:
          progress.updated_at ||
          progress.completed_at ||
          lessonUpdatedAt.get(progress.lesson_id) ||
          'completion',
        userId: input.userId,
      }),
    ),
  )

  const compendiumSourceVersion = completedProgress
    .map((progress) =>
      [
        progress.lesson_id,
        progress.updated_at || progress.completed_at || 'completion',
      ].join(':'),
    )
    .join('|')
  const compendiumJob = await enqueueCourseCompendiumJob({
    client,
    courseId: input.courseId,
    enrollmentId: input.enrollmentId,
    organizationId: input.organizationId,
    priority: 200,
    sourceVersion:
      input.sourceVersion || compendiumSourceVersion || 'course-completion',
    userId: input.userId,
  })

  return {
    compendium: {
      job: compendiumJob,
      state: resolveQueuedJobState(compendiumJob),
    },
    lessons: lessonJobs.map((job) => ({
      job,
      state: resolveQueuedJobState(job),
    })),
  }
}

export async function claimNotebookGenerationJobs(input: {
  client?: AdminClient
  leaseSeconds?: number
  limit: number
  workerId: string
}): Promise<NotebookGenerationJob[]> {
  const client = input.client ?? createAdminClient()
  const { data, error } = await flexibleRpc<NotebookGenerationJobRow[]>(client, 'claim_notebook_generation_jobs', {
    p_lease_seconds: input.leaseSeconds ?? 300,
    p_limit: input.limit,
    p_worker_id: input.workerId,
  })

  if (error) {
    throw new Error(`No se pudo reclamar la cola del cuaderno: ${error.message}`)
  }

  return ((data || []) as NotebookGenerationJobRow[]).map(mapJob)
}

export async function rescheduleNotebookGenerationJob(input: {
  client?: AdminClient
  delaySeconds: number
  jobId: string
  reason?: string
  workerId: string
}): Promise<NotebookGenerationJob> {
  const client = input.client ?? createAdminClient()
  const { data, error } = await flexibleRpc<NotebookGenerationJobRow>(client,
    'reschedule_notebook_generation_job',
    {
      p_delay_seconds: input.delaySeconds,
      p_job_id: input.jobId,
      p_reason: input.reason ?? null,
      p_worker_id: input.workerId,
    },
  )
  if (error || !data) {
    throw new Error(
      `No se pudo reprogramar la generacion: ${error?.message || 'sin respuesta'}`,
    )
  }
  return mapJob(data as NotebookGenerationJobRow)
}

export async function finishNotebookGenerationJob(input: {
  artifactStatus: Exclude<NotebookArtifactStatus, 'stale'>
  client?: AdminClient
  evidence: NotebookArtifactEvidenceInput[]
  jobId: string
  lastError?: string | null
  missingArtifacts?: string[]
  noteId?: string | null
  outcome: 'done' | 'failed'
  structuredSummary?: Record<string, Json | undefined>
  workerId: string
}): Promise<NotebookGenerationJob> {
  const client = input.client ?? createAdminClient()
  const summary = Object.fromEntries(
    Object.entries(input.structuredSummary || {}).filter(
      (entry): entry is [string, Json] => entry[1] !== undefined,
    ),
  )
  const { data, error } = await flexibleRpc<NotebookGenerationJobRow>(client,
    'finish_notebook_generation_job',
    {
      p_artifact_status: input.artifactStatus,
      p_evidence: input.evidence as unknown as Json,
      p_job_id: input.jobId,
      p_last_error: input.lastError ?? null,
      p_missing_artifacts: (input.missingArtifacts || []) as Json,
      p_note_id: input.noteId ?? null,
      p_outcome: input.outcome,
      p_structured_summary: summary as Json,
      p_worker_id: input.workerId,
    },
  )

  if (error || !data) {
    throw new Error(
      `No se pudo finalizar la generacion: ${error?.message || 'sin respuesta'}`,
    )
  }
  return mapJob(data as NotebookGenerationJobRow)
}

export async function retryNotebookGenerationJob(input: {
  client?: AdminClient
  jobId: string
  userId: string
}): Promise<NotebookGenerationJob> {
  const client = input.client ?? createAdminClient()
  const { data, error } = await flexibleRpc<NotebookGenerationJobRow>(client, 'retry_notebook_generation_job', {
    p_job_id: input.jobId,
    p_user_id: input.userId,
  })
  if (error || !data) {
    throw new Error(
      `No se pudo reintentar la generacion: ${error?.message || 'sin respuesta'}`,
    )
  }
  return mapJob(data as NotebookGenerationJobRow)
}

export async function fetchNotebookGenerationState(input: {
  client?: AdminClient
  courseId: string
  enrollmentId: string
  jobType: NotebookGenerationJobType
  lessonId: string | null
  organizationId: string
  userId: string
}): Promise<GenerationState | null> {
  const client = input.client ?? createAdminClient()
  let jobsQuery = flexibleFrom(client, 'notebook_ai_generation_jobs')
    .select(
      'job_id, job_type, user_id, organization_id, enrollment_id, course_id, lesson_id, source_hash, status, priority, attempts, max_attempts, next_attempt_at, lease_expires_at, locked_by, note_id, last_error, created_at, updated_at, finished_at',
    )
    .eq('job_type', input.jobType)
    .eq('user_id', input.userId)
    .eq('organization_id', input.organizationId)
    .eq('enrollment_id', input.enrollmentId)
    .eq('course_id', input.courseId)
  let artifactsQuery = flexibleFrom(client, 'notebook_generated_artifacts')
    .select(
      'artifact_id, note_id, source_hash, status, structured_summary, missing_artifacts, last_error, generated_at, updated_at',
    )
    .eq('artifact_type', input.jobType)
    .eq('user_id', input.userId)
    .eq('organization_id', input.organizationId)
    .eq('enrollment_id', input.enrollmentId)
    .eq('course_id', input.courseId)

  if (input.lessonId) {
    jobsQuery = jobsQuery.eq('lesson_id', input.lessonId)
    artifactsQuery = artifactsQuery.eq('lesson_id', input.lessonId)
  } else {
    jobsQuery = jobsQuery.is('lesson_id', null)
    artifactsQuery = artifactsQuery.is('lesson_id', null)
  }

  const [jobsResult, artifactsResult] = await Promise.all([
    jobsQuery.order('created_at', { ascending: false }).limit(1).maybeSingle(),
    artifactsQuery.order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (jobsResult.error) {
    throw new Error(`No se pudo consultar la generacion: ${jobsResult.error.message}`)
  }
  if (artifactsResult.error) {
    throw new Error(
      `No se pudo consultar el artefacto: ${artifactsResult.error.message}`,
    )
  }
  if (!jobsResult.data) return null

  const job = mapJob(jobsResult.data as NotebookGenerationJobRow)
  const artifact = artifactsResult.data
    ? mapArtifact(artifactsResult.data as NotebookGeneratedArtifactRow)
    : null
  return resolveGenerationState({ artifact, job })
}
