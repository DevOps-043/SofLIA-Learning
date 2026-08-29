import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runNotebookGenerationBatch } from '../notebook-generation.batch.server'
import { claimNotebookGenerationJobs } from '../notebook-generation.server.service'
import { processClaimedNotebookGenerationJobs } from '../notebook-generation.processor.server'
import type { NotebookGenerationJob } from '../notebook-generation.types'

const adminClient = { client: 'admin' }

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => adminClient),
}))
vi.mock('../notebook-generation.server.service', () => ({
  claimNotebookGenerationJobs: vi.fn(),
}))
vi.mock('../notebook-generation.processor.server', () => ({
  processClaimedNotebookGenerationJobs: vi.fn(),
}))

const claimJobsMock = vi.mocked(claimNotebookGenerationJobs)
const processClaimedJobsMock = vi.mocked(processClaimedNotebookGenerationJobs)

const claimedJob: NotebookGenerationJob = {
  attempts: 1,
  courseId: 'course-id',
  createdAt: '2026-08-28T00:00:00.000Z',
  enrollmentId: 'enrollment-id',
  finishedAt: null,
  jobId: 'job-id',
  jobType: 'lesson_auto_note',
  lastError: null,
  leaseExpiresAt: '2026-08-28T00:05:00.000Z',
  lessonId: 'lesson-id',
  lockedBy: 'worker-id',
  maxAttempts: 3,
  nextAttemptAt: '2026-08-28T00:00:00.000Z',
  noteId: null,
  organizationId: 'organization-id',
  priority: 50,
  sourceHash: 'source-hash',
  status: 'processing',
  updatedAt: '2026-08-28T00:00:00.000Z',
  userId: 'user-id',
}

describe('runNotebookGenerationBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns immediately without loading the heavy processor for an empty queue', async () => {
    claimJobsMock.mockResolvedValue([])

    await expect(
      runNotebookGenerationBatch({ limit: 10, maxRuntimeMs: 24_000 }),
    ).resolves.toEqual({
      done: 0,
      failed: 0,
      partial: 0,
      processed: 0,
      rescheduled: 0,
    })

    expect(processClaimedJobsMock).not.toHaveBeenCalled()
  })

  it('passes already claimed work to the processor without claiming twice', async () => {
    claimJobsMock.mockResolvedValue([claimedJob])
    processClaimedJobsMock.mockResolvedValue({
      done: 1,
      failed: 0,
      partial: 0,
      processed: 1,
      rescheduled: 0,
    })

    const result = await runNotebookGenerationBatch({
      limit: 10,
      maxRuntimeMs: 24_000,
      workerId: 'worker-id',
    })

    expect(result.done).toBe(1)
    expect(claimJobsMock).toHaveBeenCalledTimes(1)
    expect(processClaimedJobsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client: adminClient,
        jobs: [claimedJob],
        maxRuntimeMs: 24_000,
        workerId: 'worker-id',
      }),
    )
  })
})
