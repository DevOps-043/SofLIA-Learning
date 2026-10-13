// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { StatusComponentKey } from '@aprende-y-aplica/shared'
import { runStatusCheckPipeline } from '@/lib/status/run-status-check-pipeline'
import { POST } from '../route'

vi.mock('@/lib/status/run-status-check-pipeline', () => ({ runStatusCheckPipeline: vi.fn() }))
const pipeline = vi.mocked(runStatusCheckPipeline)

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', 'cron-secret')
  vi.stubEnv('QUEUE_INTERNAL_SECRET', '')
})
afterEach(() => vi.unstubAllEnvs())

function request(secret?: string) {
  return new NextRequest('https://learning.test/api/internal/jobs/system-status-check', {
    method: 'POST', headers: secret ? { authorization: `Bearer ${secret}` } : {},
  })
}

describe('scheduled status checks', () => {
  it('rejects unauthenticated requests before starting a component check', async () => {
    expect((await POST(request())).status).toBe(401)
    expect(pipeline).not.toHaveBeenCalled()
  })

  it('starts independent component checks concurrently within the scheduler budget', async () => {
    const completions: Array<() => void> = []
    pipeline.mockImplementation(() => new Promise(resolve => completions.push(() => resolve({
      status: 'operational', latencyMs: 1, errorClassification: 'none', errorDetail: null,
    } as Awaited<ReturnType<typeof runStatusCheckPipeline>>))))
    const pending = POST(request('cron-secret'))
    expect(pipeline).toHaveBeenCalledTimes(Object.values(StatusComponentKey).length)
    completions.forEach(complete => complete())
    expect((await pending).status).toBe(200)
  })
})
