import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runNotebookGenerationBatch } from '@/features/notebook/services/notebook-generation.batch.server'
import { GET } from '../route'

vi.mock('server-only', () => ({}))
vi.mock('@/features/notebook/services/notebook-generation.batch.server', () => ({
  runNotebookGenerationBatch: vi.fn(),
}))
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

const processJobsMock = vi.mocked(runNotebookGenerationBatch)

function createRequest(secret = 'test-cron-secret') {
  return new Request(
    'http://localhost/api/cron/process-notebook-generation?limit=10&maxRuntimeMs=24000',
    {
      headers: {
        authorization: `Bearer ${secret}`,
        'x-correlation-id': 'test-correlation-id',
      },
    },
  )
}

describe('GET /api/cron/process-notebook-generation', () => {
  const originalCronSecret = process.env.CRON_SECRET

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret'
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = originalCronSecret
    }
  })

  it('rejects requests without the cron bearer secret', async () => {
    const response = await GET(new Request('http://localhost/api/cron/process-notebook-generation'))

    expect(response.status).toBe(401)
    expect(processJobsMock).not.toHaveBeenCalled()
  })

  it('reports a missing production queue schema as a diagnosable 503', async () => {
    processJobsMock.mockRejectedValue(
      new Error("PGRST205: public.notebook_ai_generation_jobs was not found"),
    )

    const response = await GET(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(payload).toEqual({
      code: 'NOTEBOOK_QUEUE_SCHEMA_UNAVAILABLE',
      correlationId: 'test-correlation-id',
      error: 'La cola del notebook no esta disponible en la base de datos',
    })
    expect(JSON.stringify(payload)).not.toContain('notebook_ai_generation_jobs')
  })

  it('returns the processor result when the queue is healthy', async () => {
    processJobsMock.mockResolvedValue({
      done: 0,
      failed: 0,
      partial: 0,
      processed: 0,
      rescheduled: 0,
    })

    const response = await GET(createRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      done: 0,
      failed: 0,
      partial: 0,
      processed: 0,
      rescheduled: 0,
    })
  })
})
