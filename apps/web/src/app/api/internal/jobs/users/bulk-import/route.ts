import { NextRequest, NextResponse } from 'next/server'

import { importBusinessUsersFromCsv } from '@/app/api/business/users/import/import.service'
import { downloadBusinessUserImportPayload } from '@/app/api/business/users/import/payload-storage.server'
import { apiError } from '@/lib/api/errors'
import {
  markQueueJobFailed,
  markQueueJobProcessing,
  markQueueJobSucceeded,
} from '@/lib/queue/job-store.server'
import { logger } from '@/lib/utils/logger'
import { queueEnvelopeSchema, type QueueEnvelopeBody } from './schema'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const authResponse = validateQueueAuthorization(request)
  if (authResponse) return authResponse

  const parsed = await readQueueEnvelope(request)
  if (!parsed.success) {
    return nonRetryableQueueError('INVALID_QUEUE_PAYLOAD', 400)
  }

  try {
    await markQueueJobProcessing(parsed.data.jobId)

    const fileContent = await downloadBusinessUserImportPayload(
      parsed.data.payload.filePath,
    )
    const importResult = await importBusinessUsersFromCsv({
      createdBy: parsed.data.payload.createdBy,
      fileContent,
      organizationId: parsed.data.payload.organizationId,
    })

    if (!importResult.success) {
      await markQueueJobFailed({
        errorMessage: importResult.error,
        jobId: parsed.data.jobId,
      })
      return nonRetryableQueueError(importResult.error, 422)
    }

    const result = {
      imported: importResult.result.success,
      errors: importResult.result.errors.length,
      total: importResult.result.total,
    }
    await markQueueJobSucceeded({
      jobId: parsed.data.jobId,
      result,
    })

    return NextResponse.json({
      success: true,
      jobId: parsed.data.jobId,
      result,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'QUEUE_JOB_FAILED'
    await markQueueJobFailed({
      errorMessage,
      jobId: parsed.data.jobId,
    }).catch(() => undefined)

    logger.error('users.bulk-import queue job failed', error, {
      dedupKey: parsed.data.dedupKey,
      jobId: parsed.data.jobId,
    })
    return apiError('QUEUE_JOB_FAILED', 'QUEUE_JOB_FAILED', 500)
  }
}

async function readQueueEnvelope(
  request: NextRequest,
): Promise<
  | { data: QueueEnvelopeBody; success: true }
  | { success: false }
> {
  try {
    const rawBody = await request.text()
    const parsedJson = rawBody.trim() ? JSON.parse(rawBody) : null
    const parsed = queueEnvelopeSchema.safeParse(parsedJson)
    if (!parsed.success) return { success: false }
    return { data: parsed.data, success: true }
  } catch {
    return { success: false }
  }
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

function nonRetryableQueueError(error: string, statusCode: number): NextResponse {
  return apiError(error, error, 489, {
    details: { statusCode },
    headers: {
      'Upstash-NonRetryable-Error': 'true',
    },
  })
}
