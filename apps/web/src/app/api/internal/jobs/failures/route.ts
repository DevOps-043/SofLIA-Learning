import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { markQueueJobFailed } from '@/lib/queue/job-store.server'
import { logger } from '@/lib/utils/logger'
import {
  queueFailurePayloadSchema,
  type QueueFailurePayload,
} from './schema'

export const runtime = 'nodejs'

async function handlePost(
  request: NextRequest,
  payload: QueueFailurePayload,
) {
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

const validatedPost = withZodBody(
  queueFailurePayloadSchema,
  handlePost,
  { emptyBodyFallback: null },
)

export async function POST(request: NextRequest) {
  const authResponse = validateQueueAuthorization(request)
  if (authResponse) return authResponse

  return validatedPost(request, undefined)
}

function extractJobId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const record = payload as Record<string, unknown>
  return typeof record.jobId === 'string' ? record.jobId : undefined
}

function validateQueueAuthorization(request: NextRequest): NextResponse | null {
  const expectedSecret = process.env.QUEUE_INTERNAL_SECRET
  if (!expectedSecret) {
    return apiError(
      'QUEUE_INTERNAL_SECRET_NOT_CONFIGURED',
      'QUEUE_INTERNAL_SECRET_NOT_CONFIGURED',
      500,
    )
  }

  const authorization = request.headers.get('authorization')
  if (authorization !== `Bearer ${expectedSecret}`) {
    return apiError('UNAUTHORIZED_QUEUE_REQUEST', 'UNAUTHORIZED_QUEUE_REQUEST', 401)
  }

  return null
}
