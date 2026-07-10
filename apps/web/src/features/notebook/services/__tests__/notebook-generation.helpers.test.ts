import { describe, expect, it } from 'vitest'

import {
  computeNotebookGenerationSourceHash,
  extractPublicActivityFeedback,
  normalizeVisibleAssistantRole,
  resolveGenerationState,
  shouldWaitForLessonJobs,
} from '../notebook-generation.helpers'
import type {
  NotebookGeneratedArtifact,
  NotebookGenerationJob,
} from '../notebook-generation.types'

function job(
  patch: Partial<NotebookGenerationJob> = {},
): NotebookGenerationJob {
  return {
    attempts: 0,
    courseId: 'course',
    createdAt: '2026-07-10T12:00:00.000Z',
    enrollmentId: 'enrollment',
    finishedAt: null,
    jobId: 'job',
    jobType: 'lesson_auto_note',
    lastError: null,
    leaseExpiresAt: null,
    lessonId: 'lesson',
    lockedBy: null,
    maxAttempts: 3,
    nextAttemptAt: '2026-07-10T12:00:00.000Z',
    noteId: null,
    organizationId: 'organization',
    priority: 50,
    sourceHash: 'hash',
    status: 'pending',
    updatedAt: '2026-07-10T12:00:00.000Z',
    userId: 'user',
    ...patch,
  }
}

function artifact(
  patch: Partial<NotebookGeneratedArtifact> = {},
): NotebookGeneratedArtifact {
  return {
    artifactId: 'artifact',
    generatedAt: '2026-07-10T12:01:00.000Z',
    lastError: null,
    missingArtifacts: [],
    noteId: 'note',
    sourceHash: 'hash',
    status: 'ready',
    structuredSummary: {},
    updatedAt: '2026-07-10T12:01:00.000Z',
    ...patch,
  }
}

describe('notebook generation helpers', () => {
  it('makes source hashes idempotent and changes them for new evidence', () => {
    const base = {
      courseId: 'course',
      enrollmentId: 'enrollment',
      jobType: 'lesson_auto_note' as const,
      lessonId: 'lesson',
      sourceVersion: 'message-1',
      userId: 'user',
    }
    expect(computeNotebookGenerationSourceHash(base)).toBe(
      computeNotebookGenerationSourceHash(base),
    )
    expect(computeNotebookGenerationSourceHash(base)).not.toBe(
      computeNotebookGenerationSourceHash({
        ...base,
        sourceVersion: 'message-2',
      }),
    )
  })

  it('maps queue/artifact combinations to user-facing states', () => {
    expect(
      resolveGenerationState({ artifact: null, job: job() }).status,
    ).toBe('queued')
    expect(
      resolveGenerationState({
        artifact: artifact({ status: 'partial' }),
        job: job({ noteId: 'note', status: 'done' }),
      }),
    ).toMatchObject({ noteId: 'note', retryable: true, status: 'partial' })
    expect(
      resolveGenerationState({
        artifact: artifact(),
        job: job({ noteId: 'note', status: 'done' }),
      }).status,
    ).toBe('ready')
  })

  it('keeps only learner-visible roles and feedback fields', () => {
    expect(normalizeVisibleAssistantRole('system')).toBeNull()
    expect(normalizeVisibleAssistantRole('model')).toBe('assistant')
    expect(
      extractPublicActivityFeedback({
        backend_notes: 'private',
        instructor_summary: 'private',
        strengths: ['Claro'],
        student_feedback: 'Buen trabajo',
      }),
    ).toEqual(['Buen trabajo', 'Claro'])
  })

  it('waits at most fifteen minutes for active lesson jobs', () => {
    const createdAt = '2026-07-10T12:00:00.000Z'
    expect(
      shouldWaitForLessonJobs({
        activeLessonJobs: 1,
        courseJobCreatedAt: createdAt,
        nowMs: Date.parse('2026-07-10T12:14:59.000Z'),
      }),
    ).toBe(true)
    expect(
      shouldWaitForLessonJobs({
        activeLessonJobs: 1,
        courseJobCreatedAt: createdAt,
        nowMs: Date.parse('2026-07-10T12:15:00.000Z'),
      }),
    ).toBe(false)
  })
})
