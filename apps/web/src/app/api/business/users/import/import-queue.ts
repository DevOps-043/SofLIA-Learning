import { createHash } from 'node:crypto'

import {
  createQueueJobId,
  enqueueQueueJob,
  isQueueProviderConfigured,
  type QueueEnqueueResult,
} from '@/lib/queue'
import {
  createQueueJobRecord,
  getActiveQueueJobByDedupKey,
  markQueueJobPublishFailed,
  markQueueJobQueued,
} from '@/lib/queue/job-store.server'
import { uploadBusinessUserImportPayload } from './payload-storage.server'

export const BUSINESS_USER_IMPORT_QUEUE_THRESHOLD_ROWS = 50

export interface BusinessUserImportJobPayload {
  createdBy: string
  filePath: string
  organizationId: string
}

export interface BusinessUserImportQueuePayload {
  createdBy: string
  fileContent: string
  organizationId: string
}

export function shouldQueueBusinessUserImport(params: {
  fileContent: string
  forceAsync?: boolean
}): boolean {
  if (!isQueueProviderConfigured()) return false
  if (params.forceAsync) return true

  return countCsvDataRows(params.fileContent) >= BUSINESS_USER_IMPORT_QUEUE_THRESHOLD_ROWS
}

export async function enqueueBusinessUserImportJob(
  payload: BusinessUserImportQueuePayload,
): Promise<QueueEnqueueResult> {
  const jobId = createQueueJobId('users.bulk-import')
  const dedupKey = buildBusinessUserImportDedupKey(payload)
  const activeJob = await getActiveQueueJobByDedupKey({
    dedupKey,
    organizationId: payload.organizationId,
  })

  if (activeJob) {
    return {
      deduplicated: true,
      jobId: activeJob.job_id,
      messageId: activeJob.provider_message_id ?? undefined,
      provider: 'qstash',
      queued: true,
    }
  }

  const filePath = await uploadBusinessUserImportPayload({
    fileContent: payload.fileContent,
    jobId,
    organizationId: payload.organizationId,
  })
  const queuePayload: BusinessUserImportJobPayload = {
    createdBy: payload.createdBy,
    filePath,
    organizationId: payload.organizationId,
  }

  await createQueueJobRecord({
    createdBy: payload.createdBy,
    dedupKey,
    jobId,
    jobName: 'users.bulk-import',
    organizationId: payload.organizationId,
    payloadRef: filePath,
  })

  const queueResult = await enqueueQueueJob({
    dedupKey,
    jobId,
    failureCallbackPath: '/api/internal/jobs/failures',
    jobName: 'users.bulk-import',
    payload: queuePayload,
    providerDedupKey: jobId,
    targetPath: '/api/internal/jobs/users/bulk-import',
  })

  if (queueResult.queued) {
    await markQueueJobQueued({
      jobId,
      providerMessageId: queueResult.messageId,
    })
    return { ...queueResult, jobId }
  }

  await markQueueJobPublishFailed({
    errorMessage: queueResult.reason ?? 'publish_failed',
    jobId,
  })

  return { ...queueResult, jobId }
}

function buildBusinessUserImportDedupKey(
  payload: BusinessUserImportQueuePayload,
): string {
  const hash = createHash('sha256')
    .update(payload.organizationId)
    .update(payload.createdBy)
    .update(payload.fileContent)
    .digest('hex')
    .slice(0, 32)

  return `users.bulk-import:${payload.organizationId}:${hash}`
}

function countCsvDataRows(fileContent: string): number {
  return fileContent
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .length
}
