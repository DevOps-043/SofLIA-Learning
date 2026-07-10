import { createHash } from 'node:crypto'

import type {
  GenerationState,
  NotebookGeneratedArtifact,
  NotebookGenerationJob,
  NotebookGenerationJobType,
} from './notebook-generation.types'

function canonicalPart(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase()
}

export function computeNotebookGenerationSourceHash(input: {
  courseId: string
  enrollmentId: string
  jobType: NotebookGenerationJobType
  lessonId?: string | null
  sourceVersion?: string
  userId: string
}): string {
  const canonical = [
    input.jobType,
    input.userId,
    input.enrollmentId,
    input.courseId,
    input.lessonId || '',
    input.sourceVersion || 'completion',
  ]
    .map(canonicalPart)
    .join('\u001f')

  return createHash('sha256').update(canonical).digest('hex')
}

export function normalizeVisibleAssistantRole(
  role: string | null | undefined,
): 'assistant' | 'user' | null {
  const normalized = canonicalPart(role)
  if (normalized === 'user') return 'user'
  if (['assistant', 'lia', 'model', 'soflia'].includes(normalized)) {
    return 'assistant'
  }
  return null
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Extracts only fields explicitly intended for the learner. Rubrics, raw
 * evaluator payloads and instructor-only summaries never cross this allowlist.
 */
export function extractPublicActivityFeedback(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []

  const record = value as Record<string, unknown>
  const scalarKeys = [
    'feedback',
    'student_feedback',
    'message',
    'summary',
  ] as const
  const listKeys = ['strengths', 'improvements', 'next_steps'] as const
  const values: string[] = []

  for (const key of scalarKeys) {
    const candidate = nonEmptyString(record[key])
    if (candidate) values.push(candidate)
  }

  for (const key of listKeys) {
    const candidate = record[key]
    if (!Array.isArray(candidate)) continue
    for (const item of candidate) {
      const normalized = nonEmptyString(item)
      if (normalized) values.push(normalized)
    }
  }

  return Array.from(new Set(values))
}

export function resolveGenerationState(input: {
  artifact: NotebookGeneratedArtifact | null
  job: NotebookGenerationJob
}): GenerationState {
  const { artifact, job } = input
  const noteId = artifact?.noteId || job.noteId || undefined
  const base = {
    noteId,
    sourceHash: artifact?.sourceHash || job.sourceHash,
    targetType: job.jobType,
    updatedAt: artifact?.updatedAt || job.updatedAt,
  }

  if (job.status === 'processing') {
    return { ...base, retryable: false, status: 'processing' }
  }
  if (job.status === 'pending') {
    return { ...base, retryable: false, status: 'queued' }
  }
  if (artifact?.status === 'partial') {
    return { ...base, retryable: true, status: 'partial' }
  }
  if (artifact?.status === 'ready') {
    return { ...base, retryable: false, status: 'ready' }
  }
  if (job.status === 'done' && job.noteId) {
    return { ...base, retryable: false, status: 'ready' }
  }
  if (artifact?.status === 'stale' || job.status === 'skipped') {
    return { ...base, retryable: true, status: 'stale' }
  }
  if (job.status === 'failed' && job.attempts < job.maxAttempts) {
    return { ...base, retryable: false, status: 'queued' }
  }
  return { ...base, retryable: true, status: 'failed' }
}

export function resolveQueuedJobState(
  job: NotebookGenerationJob,
): GenerationState {
  return resolveGenerationState({ artifact: null, job })
}

export function shouldWaitForLessonJobs(input: {
  activeLessonJobs: number
  courseJobCreatedAt: string
  maxWaitMs?: number
  nowMs?: number
}): boolean {
  if (input.activeLessonJobs === 0) return false
  const createdAt = Date.parse(input.courseJobCreatedAt)
  if (!Number.isFinite(createdAt)) return false

  return (
    (input.nowMs ?? Date.now()) - createdAt <
    (input.maxWaitMs ?? 15 * 60 * 1000)
  )
}
