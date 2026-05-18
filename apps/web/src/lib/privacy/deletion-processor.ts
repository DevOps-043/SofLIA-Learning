import 'server-only'

import { createHmac } from 'crypto'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { writeSecurityAuditLog } from '@/lib/security/security-audit-log'

export interface PrivacyDeletionRunResult {
  completed: number
  errors: Array<{ requestId: string; message: string }>
  scanned: number
}

type PrivacyDeletionRequestRow = {
  id: string
  metadata: Record<string, unknown> | null
  requested_at: string
  scheduled_deletion_at: string
  subject_user_id: string | null
  user_id: string | null
}

type PrivacyDeletionRequestUpdate = {
  completed_at?: string
  metadata?: Record<string, unknown>
  status?: 'pending' | 'cancelled' | 'completed'
  subject_user_id?: string | null
  user_id?: string | null
}

type PrivacyDeletionTombstoneInsert = {
  completed_at: string
  metadata: Record<string, unknown>
  original_request_id: string
  scheduled_deletion_at: string
  subject_id_hash: string
}

type DeleteUserCascadeRpcClient = {
  rpc: (
    fn: 'delete_user_cascade',
    args: { target_user_id: string },
  ) => Promise<{ data: unknown; error: { message?: string } | null }>
}

const DEFAULT_BATCH_SIZE = 25
const LOCAL_TOMBSTONE_SECRET = 'local-privacy-tombstone-secret'

export async function processDuePrivacyDeletions(
  now = new Date(),
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<PrivacyDeletionRunResult> {
  const supabase = createAdminClient()
  const dueRequests = fromLoose<PrivacyDeletionRequestRow>(
    supabase,
    'privacy_deletion_requests',
  )

  const { data, error } = await dueRequests
    .select('id, user_id, subject_user_id, requested_at, scheduled_deletion_at, metadata')
    .eq('status', 'pending')
    .lte('scheduled_deletion_at', now.toISOString())
    .order('scheduled_deletion_at', { ascending: true })
    .limit(batchSize)

  if (error) {
    throw new Error(error.message)
  }

  const requests = data ?? []
  const results = await Promise.all(
    requests.map((request) => processPrivacyDeletionRequest(request, now)),
  )

  return results.reduce<PrivacyDeletionRunResult>(
    (summary, result, index) => {
      summary.scanned += 1

      if (result.ok) {
        summary.completed += 1
      } else {
        summary.errors.push({
          requestId: requests[index]?.id ?? 'unknown',
          message: result.message,
        })
      }

      return summary
    },
    { completed: 0, errors: [], scanned: 0 },
  )
}

async function processPrivacyDeletionRequest(
  request: PrivacyDeletionRequestRow,
  now: Date,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = createAdminClient()
  const rpcClient = supabase as unknown as DeleteUserCascadeRpcClient

  try {
    const subjectUserId = readSubjectUserId(request)

    const { error } = await rpcClient.rpc('delete_user_cascade', {
      target_user_id: subjectUserId,
    })

    if (error) {
      throw new Error(error.message ?? 'delete_user_cascade failed')
    }

    await markDeletionRequestCompleted(request, now)
    const tombstoneError = await tryCreateDeletionTombstone(request, now)

    await writeSecurityAuditLog({
      action: 'privacy-deletion-completed',
      actorId: null,
      resourceType: 'privacy_deletion_request',
      resourceId: request.id,
      result: 'success',
      metadata: {
        requestId: request.id,
        scheduledDeletionAt: request.scheduled_deletion_at,
        subjectIdHash: hashSubjectId(subjectUserId),
        tombstoneWriteFailed: Boolean(tombstoneError),
      },
    })

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await markDeletionRequestFailed(request, now, message)
    await writeSecurityAuditLog({
      action: 'privacy-deletion-completion-failed',
      actorId: null,
      resourceType: 'privacy_deletion_request',
      resourceId: request.id,
      result: 'error',
      metadata: {
        requestId: request.id,
        message,
        subjectIdHash: request.subject_user_id
          ? hashSubjectId(request.subject_user_id)
          : undefined,
      },
    })

    return { ok: false, message }
  }
}

async function markDeletionRequestCompleted(
  request: PrivacyDeletionRequestRow,
  now: Date,
) {
  const supabase = createAdminClient()
  const subjectUserId = readSubjectUserId(request)
  const requests = fromLoose<PrivacyDeletionRequestRow, PrivacyDeletionRequestUpdate>(
    supabase,
    'privacy_deletion_requests',
  )

  const { error } = await requests
    .update({
      completed_at: now.toISOString(),
      metadata: {
        ...metadataRecord(request.metadata),
        completedBy: 'privacy-deletion-job',
        completedAt: now.toISOString(),
        subjectIdHash: hashSubjectId(subjectUserId),
      },
      status: 'completed',
      subject_user_id: null,
      user_id: null,
    })
    .eq('id', request.id)

  if (error) {
    throw new Error(error.message)
  }
}

async function markDeletionRequestFailed(
  request: PrivacyDeletionRequestRow,
  now: Date,
  message: string,
) {
  const supabase = createAdminClient()
  const requests = fromLoose<PrivacyDeletionRequestRow, PrivacyDeletionRequestUpdate>(
    supabase,
    'privacy_deletion_requests',
  )
  const previousMetadata = metadataRecord(request.metadata)
  const previousAttempts =
    typeof previousMetadata.deletionAttempts === 'number'
      ? previousMetadata.deletionAttempts
      : 0

  await requests
    .update({
      metadata: {
        ...previousMetadata,
        deletionAttempts: previousAttempts + 1,
        lastDeletionError: message,
        lastDeletionFailedAt: now.toISOString(),
        subjectIdHash: request.subject_user_id
          ? hashSubjectId(request.subject_user_id)
          : undefined,
      },
    })
    .eq('id', request.id)
}

async function tryCreateDeletionTombstone(
  request: PrivacyDeletionRequestRow,
  now: Date,
) {
  const supabase = createAdminClient()
  const subjectUserId = readSubjectUserId(request)
  const tombstones = fromLoose<unknown, PrivacyDeletionTombstoneInsert>(
    supabase,
    'privacy_deletion_tombstones',
  )

  const { error } = await tombstones.upsert(
    {
      completed_at: now.toISOString(),
      metadata: {
        requestedAt: request.requested_at,
      },
      original_request_id: request.id,
      scheduled_deletion_at: request.scheduled_deletion_at,
      subject_id_hash: hashSubjectId(subjectUserId),
    },
    { onConflict: 'original_request_id' },
  )

  return error?.message ?? null
}

function metadataRecord(metadata: Record<string, unknown> | null) {
  if (!metadata || Array.isArray(metadata)) {
    return {}
  }

  return metadata
}

function readSubjectUserId(request: PrivacyDeletionRequestRow) {
  if (!request.subject_user_id) {
    throw new Error('privacy deletion request is missing subject_user_id')
  }

  return request.subject_user_id
}

export function hashSubjectId(userId: string) {
  const secret =
    process.env.PRIVACY_TOMBSTONE_SECRET ||
    process.env.USER_JWT_SECRET

  if (secret) {
    return createHmac('sha256', secret).update(userId).digest('hex')
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('PRIVACY_TOMBSTONE_SECRET is required in production')
  }

  return createHmac('sha256', LOCAL_TOMBSTONE_SECRET).update(userId).digest('hex')
}
