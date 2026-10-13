import { afterEach, describe, expect, it, vi } from 'vitest'
import { processClaimedNotebookGenerationJobs } from '../notebook-generation.processor.server'
import { rescheduleNotebookGenerationJob } from '../notebook-generation.server.service'
import type { NotebookGenerationJob } from '../notebook-generation.types'
import type { createAdminClient } from '@/lib/supabase/admin'

vi.mock('../notebook-generation.server.service', () => ({
  claimNotebookGenerationJobs: vi.fn(), finishNotebookGenerationJob: vi.fn(),
  rescheduleNotebookGenerationJob: vi.fn(async () => ({})),
}))

afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks() })

describe('notebook queue runtime budget', () => {
  it('releases every unstarted lease without consuming a failure attempt', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(25_000)
    const from = vi.fn(() => { throw new Error('No job should begin without a persistence budget') })
    const client = { from } as unknown as ReturnType<typeof createAdminClient>
    const jobs = ['first', 'second'].map(jobId => ({ jobId }) as NotebookGenerationJob)
    const result = await processClaimedNotebookGenerationJobs({
      client, jobs, maxRuntimeMs: 24_000, startedAt: 1_000, workerId: 'worker',
    })
    expect(result).toEqual({ processed: 0, done: 0, failed: 0, partial: 0, rescheduled: 2 })
    expect(from).not.toHaveBeenCalled()
    for (const job of jobs) {
      expect(rescheduleNotebookGenerationJob).toHaveBeenCalledWith({
        client, delaySeconds: 5, jobId: job.jobId, reason: 'RUNTIME_BUDGET_EXHAUSTED', workerId: 'worker',
      })
    }
  })
})
