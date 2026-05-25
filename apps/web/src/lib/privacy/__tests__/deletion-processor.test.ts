import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { createAdminClient as createAdminClientType } from '@/lib/supabase/admin'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/security/security-audit-log', () => ({
  writeSecurityAuditLog: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { writeSecurityAuditLog } from '@/lib/security/security-audit-log'
import { processDuePrivacyDeletions } from '../deletion-processor'

type SupabaseAdminClient = ReturnType<typeof createAdminClientType>
type ViMock = ReturnType<typeof vi.fn>

type PrivacyDeletionRequestFixture = {
  id: string
  metadata: Record<string, unknown> | null
  requested_at: string
  scheduled_deletion_at: string
  subject_user_id: string
  user_id: string | null
}

type DueRequestsChain = {
  eq: ViMock
  limit: ViMock
  lte: ViMock
  order: ViMock
  select: ViMock
}

type UpdateChain = {
  eq: ViMock
  update: ViMock
}

type UpsertTable = {
  upsert: ViMock
}

const dueRequest: PrivacyDeletionRequestFixture = {
  id: 'request-1',
  metadata: null,
  requested_at: '2026-04-18T10:00:00.000Z',
  scheduled_deletion_at: '2026-05-18T10:00:00.000Z',
  subject_user_id: 'user-1',
  user_id: 'user-1',
}

describe('processDuePrivacyDeletions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PRIVACY_TOMBSTONE_SECRET = 'test-privacy-secret'
  })

  it('deletes due users and stores only a hashed tombstone', async () => {
    const dueRequestsChain = createDueRequestsChain([dueRequest])
    const completedUpdateChain = createUpdateChain()
    const tombstoneTable = createUpsertTable()
    const rpc = vi.fn(async () => ({ data: null, error: null }))

    mockAdminClients(
      clientWithTable(dueRequestsChain),
      { rpc } as unknown as SupabaseAdminClient,
      clientWithTable(completedUpdateChain),
      clientWithTable(tombstoneTable),
    )

    const result = await processDuePrivacyDeletions(
      new Date('2026-05-18T10:01:00.000Z'),
    )

    expect(result).toEqual({ completed: 1, errors: [], scanned: 1 })
    expect(rpc).toHaveBeenCalledWith('delete_user_cascade', {
      target_user_id: 'user-1',
    })
    expect(completedUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: '2026-05-18T10:01:00.000Z',
        status: 'completed',
        subject_user_id: null,
        user_id: null,
      }),
    )
    expect(tombstoneTable.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        original_request_id: 'request-1',
        subject_id_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      { onConflict: 'original_request_id' },
    )
    expect(writeSecurityAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'privacy-deletion-completed',
        actorId: null,
        result: 'success',
      }),
    )
  })

  it('keeps the request pending and records a failed attempt when cascade deletion fails', async () => {
    const dueRequestsChain = createDueRequestsChain([
      { ...dueRequest, metadata: { deletionAttempts: 2 } },
    ])
    const failedUpdateChain = createUpdateChain()
    const rpc = vi.fn(async () => ({
      data: null,
      error: { message: 'delete failed' },
    }))

    mockAdminClients(
      clientWithTable(dueRequestsChain),
      { rpc } as unknown as SupabaseAdminClient,
      clientWithTable(failedUpdateChain),
    )

    const result = await processDuePrivacyDeletions(
      new Date('2026-05-18T10:01:00.000Z'),
    )

    expect(result).toEqual({
      completed: 0,
      errors: [{ requestId: 'request-1', message: 'delete failed' }],
      scanned: 1,
    })
    expect(failedUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          deletionAttempts: 3,
          lastDeletionError: 'delete failed',
          subjectIdHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    )
    expect(writeSecurityAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'privacy-deletion-completion-failed',
        result: 'error',
      }),
    )
  })
})

function createDueRequestsChain(
  data: PrivacyDeletionRequestFixture[],
): DueRequestsChain {
  const chain = {} as DueRequestsChain
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.lte = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.limit = vi.fn(async () => ({ data, error: null }))
  return chain
}

function createUpdateChain(): UpdateChain {
  const chain = {} as UpdateChain
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(async () => ({ error: null }))
  return chain
}

function createUpsertTable(): UpsertTable {
  return {
    upsert: vi.fn(async () => ({ error: null })),
  }
}

function clientWithTable(table: unknown): SupabaseAdminClient {
  return {
    from: vi.fn(() => table),
  } as unknown as SupabaseAdminClient
}

function mockAdminClients(...clients: SupabaseAdminClient[]) {
  const mockedCreateAdminClient = vi.mocked(createAdminClient)
  clients.forEach((client) => {
    mockedCreateAdminClient.mockReturnValueOnce(client)
  })
}
