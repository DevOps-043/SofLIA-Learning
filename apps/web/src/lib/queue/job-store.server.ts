import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { createAdminClient } from '@/lib/supabase/admin'
import type { QueueJobName } from '@/lib/queue'

export type QueueJobStatus =
  | 'dead_letter'
  | 'failed'
  | 'pending_publish'
  | 'processing'
  | 'publish_failed'
  | 'queued'
  | 'succeeded'

export interface QueueJobRecord {
  attempts: number
  completed_at: string | null
  created_by: string | null
  dedup_key: string
  error_message: string | null
  job_id: string
  job_name: QueueJobName
  organization_id: string | null
  payload_ref: string | null
  provider: 'qstash'
  provider_message_id: string | null
  queued_at: string
  result: Record<string, unknown> | null
  started_at: string | null
  status: QueueJobStatus
  updated_at: string
}

export async function createQueueJobRecord(params: {
  createdBy?: string
  dedupKey: string
  jobId: string
  jobName: QueueJobName
  organizationId?: string
  payloadRef?: string
}): Promise<void> {
  const client = getQueueJobClient()
  const { error } = await client
    .from('async_jobs')
    .upsert({
      created_by: params.createdBy ?? null,
      dedup_key: params.dedupKey,
      job_id: params.jobId,
      job_name: params.jobName,
      organization_id: params.organizationId ?? null,
      payload_ref: params.payloadRef ?? null,
      provider: 'qstash',
      status: 'pending_publish',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'job_id' })

  if (error) {
    throw new Error(`No se pudo crear async job: ${error.message}`)
  }
}

export async function markQueueJobQueued(params: {
  jobId: string
  providerMessageId?: string
}): Promise<void> {
  await updateQueueJob(params.jobId, {
    provider_message_id: params.providerMessageId ?? null,
    status: 'queued',
  })
}

export async function markQueueJobPublishFailed(params: {
  errorMessage: string
  jobId: string
}): Promise<void> {
  await updateQueueJob(params.jobId, {
    completed_at: new Date().toISOString(),
    error_message: params.errorMessage,
    status: 'publish_failed',
  })
}

export async function markQueueJobProcessing(jobId: string): Promise<void> {
  await updateQueueJob(jobId, {
    started_at: new Date().toISOString(),
    status: 'processing',
  })
}

export async function markQueueJobSucceeded(params: {
  jobId: string
  result: Record<string, unknown>
}): Promise<void> {
  await updateQueueJob(params.jobId, {
    completed_at: new Date().toISOString(),
    error_message: null,
    result: params.result,
    status: 'succeeded',
  })
}

export async function markQueueJobFailed(params: {
  errorMessage: string
  jobId: string
  status?: Extract<QueueJobStatus, 'dead_letter' | 'failed'>
}): Promise<void> {
  const client = getQueueJobClient()
  const { error } = await client.rpc('increment_async_job_attempts', {
    p_error_message: params.errorMessage,
    p_job_id: params.jobId,
    p_status: params.status ?? 'failed',
  })

  if (error) {
    throw new Error(`No se pudo marcar async job como fallido: ${error.message}`)
  }
}

export async function getActiveQueueJobByDedupKey(params: {
  dedupKey: string
  organizationId: string
}): Promise<QueueJobRecord | null> {
  const { data, error } = await getQueueJobClient()
    .from('async_jobs')
    .select(
      'job_id, job_name, dedup_key, provider, provider_message_id, status, organization_id, created_by, payload_ref, attempts, result, error_message, queued_at, started_at, completed_at, updated_at',
    )
    .eq('dedup_key', params.dedupKey)
    .eq('organization_id', params.organizationId)
    .in('status', ['pending_publish', 'queued', 'processing'])
    .order('queued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo consultar async job activo: ${error.message}`)
  }

  return (data ?? null) as QueueJobRecord | null
}

export async function getQueueJobForOrganization(params: {
  jobId: string
  organizationId: string
}): Promise<QueueJobRecord | null> {
  const { data, error } = await getQueueJobClient()
    .from('async_jobs')
    .select(
      'job_id, job_name, dedup_key, provider, provider_message_id, status, organization_id, created_by, payload_ref, attempts, result, error_message, queued_at, started_at, completed_at, updated_at',
    )
    .eq('job_id', params.jobId)
    .eq('organization_id', params.organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo consultar async job: ${error.message}`)
  }

  return (data ?? null) as QueueJobRecord | null
}

function getQueueJobClient(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

async function updateQueueJob(
  jobId: string,
  values: Record<string, unknown>,
): Promise<void> {
  const { error } = await getQueueJobClient()
    .from('async_jobs')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('job_id', jobId)

  if (error) {
    throw new Error(`No se pudo actualizar async job: ${error.message}`)
  }
}
