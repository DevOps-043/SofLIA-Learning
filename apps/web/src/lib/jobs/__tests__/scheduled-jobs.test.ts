// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validateScheduledJobAuthorization } from '../scheduled-job-auth'
import { handler as statusHandler } from '../../../../../../netlify/functions/system-status-check'
import { handler as securityHandler } from '../../../../../../netlify/functions/process-security-alerts'
import { handler as notebookScheduler } from '../../../../../../netlify/functions/process-notebook-generation'
import { handler as notebookWorker } from '../../../../../../netlify/functions/process-notebook-generation-background'
import { callJob } from '../../../../../../netlify/lib/call-job'

const fetchMock = vi.fn<typeof fetch>()
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  vi.stubEnv('URL', 'https://current-deploy.netlify.app')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://old-domain.test')
  vi.stubEnv('CRON_SECRET', 'cron-secret')
  vi.stubEnv('QUEUE_INTERNAL_SECRET', '')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function authorizedRequest(secret: string) {
  return new Request('https://learning.test/api/internal/jobs/system-status-check', {
    headers: { authorization: `Bearer ${secret}` },
  })
}
const workerEvent = { httpMethod: 'POST', headers: { authorization: 'Bearer cron-secret' } }

describe('scheduled job credentials and transport', () => {
  it.each([statusHandler, securityHandler])('uses the same configured secret as the HTTP guard', async handler => {
    fetchMock.mockResolvedValue(new Response('{"success":true}', { status: 200 }))
    const result = await handler()
    expect(result.statusCode).toBe(200)
    expect(validateScheduledJobAuthorization(authorizedRequest('cron-secret'))).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({
      headers: { Authorization: 'Bearer cron-secret' }, redirect: 'error', signal: expect.any(AbortSignal),
    }))
    expect(String(fetchMock.mock.calls[0][0])).toContain('https://current-deploy.netlify.app/api/internal/jobs/')
  })

  it('retains a dedicated queue credential and rejects the cron credential when one is configured', async () => {
    vi.stubEnv('QUEUE_INTERNAL_SECRET', 'queue-secret')
    fetchMock.mockResolvedValue(new Response('{}'))
    await statusHandler()
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ headers: { Authorization: 'Bearer queue-secret' } }))
    expect(validateScheduledJobAuthorization(authorizedRequest('queue-secret'))).toBeNull()
    expect(validateScheduledJobAuthorization(authorizedRequest('cron-secret'))?.status).toBe(401)
  })

  it('fails closed without any configured credential', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await securityHandler()).statusCode).toBe(500)
    expect(validateScheduledJobAuthorization(authorizedRequest('anything'))?.status).toBe(500)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports network and timeout failures without returning raw exception details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchMock.mockRejectedValueOnce(new Error('sensitive-url-or-secret'))
    const failed = await callJob({ pathname: '/api/internal/jobs/security-alerts', secret: 'cron-secret' })
    expect(failed.statusCode).toBe(502)
    expect(failed.body).not.toContain('sensitive')
    fetchMock.mockResolvedValueOnce({ status: 200, headers: new Headers(), text: async () => { throw new DOMException('expired', 'TimeoutError') } } as Response)
    expect((await callJob({ pathname: '/api/internal/jobs/security-alerts', secret: 'cron-secret' })).statusCode).toBe(504)
  })
})

describe('notebook background dispatch', () => {
  it('acknowledges dispatch without waiting for AI', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 202 }))
    expect((await notebookScheduler()).statusCode).toBe(202)
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://current-deploy.netlify.app/.netlify/functions/process-notebook-generation-background')
  })

  it('rejects unauthorized work before contacting the queue', async () => {
    expect((await notebookWorker({ ...workerEvent, headers: {} })).statusCode).toBe(401)
    expect((await notebookWorker({ ...workerEvent, httpMethod: 'GET' })).statusCode).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stops on an idle queue and claims a single job per HTTP batch', async () => {
    fetchMock.mockResolvedValue(new Response('{"processed":0,"failed":0}'))
    await notebookWorker(workerEvent)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('?limit=1&maxRuntimeMs=24000')
  })

  it('bounds a busy queue to ten batches', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    fetchMock.mockImplementation(async () => new Response('{"processed":1,"failed":0}'))
    await notebookWorker(workerEvent)
    expect(fetchMock).toHaveBeenCalledTimes(10)
  })

  it('fails the background invocation when the queue endpoint is unavailable', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 503 }))
    await expect(notebookWorker(workerEvent)).rejects.toThrow('NOTEBOOK_BATCH_REQUEST_FAILED:503')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
