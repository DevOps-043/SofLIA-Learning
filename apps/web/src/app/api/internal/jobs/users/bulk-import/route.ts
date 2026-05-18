import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { importBusinessUsersFromCsv } from '@/app/api/business/users/import/import.service'
import { downloadBusinessUserImportPayload } from '@/app/api/business/users/import/payload-storage.server'
import {
  markQueueJobFailed,
  markQueueJobProcessing,
  markQueueJobSucceeded,
} from '@/lib/queue/job-store.server'
import { logger } from '@/lib/utils/logger'

const QueueEnvelopeSchema = z.object({
  dedupKey: z.string().min(1),
  enqueuedAt: z.string().min(1),
  jobId: z.string().min(1),
  jobName: z.literal('users.bulk-import'),
  payload: z.object({
    createdBy: z.string().min(1),
    filePath: z.string().min(1),
    organizationId: z.string().min(1),
  }),
})

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const authResponse = validateQueueAuthorization(request)
  if (authResponse) return authResponse

  const parsed = QueueEnvelopeSchema.safeParse(
    await request.json().catch(() => null),
  )

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
    return NextResponse.json(
      { success: false, error: 'QUEUE_JOB_FAILED' },
      { status: 500 },
    )
  }
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

function nonRetryableQueueError(error: string, statusCode: number): NextResponse {
  return NextResponse.json(
    { success: false, error, statusCode },
    {
      status: 489,
      headers: {
        'Upstash-NonRetryable-Error': 'true',
      },
    },
  )
}
