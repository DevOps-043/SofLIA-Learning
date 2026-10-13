import { callJob } from '../lib/call-job'
import { logger } from '../../apps/web/src/lib/logger'

interface WorkerEvent {
  httpMethod: string
  headers: Record<string, string | undefined>
}

export async function handler(event: WorkerEvent) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' }
  const secret = process.env.CRON_SECRET
  const authorization = event.headers.authorization ?? event.headers.Authorization
  if (!secret || authorization !== `Bearer ${secret}`) return { statusCode: 401, body: '' }

  // Each HTTP batch owns one lease. Ten bounded batches fit inside the
  // background limit, while idle queues terminate after the first request.
  for (let batch = 0; batch < 10; batch += 1) {
    const response = await callJob({
      pathname: '/api/cron/process-notebook-generation?limit=1&maxRuntimeMs=24000',
      secret,
      method: 'GET',
      timeoutMs: 55_000,
    })
    if (response.statusCode !== 200) {
      // Throw so Netlify records a failed worker and can retry it. The durable
      // queue prevents another worker from processing an unexpired lease.
      throw new Error(`NOTEBOOK_BATCH_REQUEST_FAILED:${response.statusCode}`)
    }
    const result = JSON.parse(response.body) as { processed?: unknown; failed?: unknown }
    if (typeof result.processed !== 'number' || typeof result.failed !== 'number') {
      throw new Error('NOTEBOOK_BATCH_INVALID_RESPONSE')
    }
    logger.info('notebook-worker.batch_completed', { batch, processed: result.processed, failed: result.failed })
    if (result.processed === 0) break
  }
  return { statusCode: 200, body: '' }
}
