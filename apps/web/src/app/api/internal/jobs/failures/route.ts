import { NextRequest, NextResponse } from 'next/server'

import { markQueueJobFailed } from '@/lib/queue/job-store.server'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const authResponse = validateQueueAuthorization(request)
  if (authResponse) return authResponse

  const payload = await request.json().catch(() => null)
  const jobId = extractJobId(payload)
  if (jobId) {
    await markQueueJobFailed({
      errorMessage: 'QSTASH_DEAD_LETTER',
      jobId,
      status: 'dead_letter',
    }).catch((error) => {
      logger.error('queue.job.dead_letter_status_update_failed', error, { jobId })
    })
  }

  logger.error('queue.job.dead_letter', {
    jobId,
    payloadType: typeof payload,
    qstashMessageId: request.headers.get('upstash-message-id') || undefined,
    qstashRetried: request.headers.get('upstash-retried') || undefined,
  })

  return NextResponse.json({ success: true })
}

function extractJobId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const record = payload as Record<string, unknown>
  return typeof record.jobId === 'string' ? record.jobId : undefined
}

function validateQueueAuthorization(request: NextRequest): NextResponse | null {
  const expectedSecret = process.env.QUEUE_INTERNAL_SECRET
  if (!expectedSecret) {
    return NextResponse.json(
      { success: false, error: 'QUEUE_INTERNAL_SECRET_NOT_CONFIGURED' },
      { status: 500 },
    )
  }

  const authorization = request.headers.get('authorization')
  if (authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_QUEUE_REQUEST' },
      { status: 401 },
    )
  }

  return null
}
