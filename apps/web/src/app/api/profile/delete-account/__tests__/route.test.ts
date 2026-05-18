import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { createAdminClient as createAdminClientType } from '@/lib/supabase/admin'

vi.mock('@/features/auth/services/session.service', () => ({
  SessionService: {
    getCurrentUser: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/security/security-events', () => ({
  recordSecurityEvent: vi.fn(),
}))

import { SessionService } from '@/features/auth/services/session.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordSecurityEvent } from '@/lib/security/security-events'
import { POST } from '../route'

type SupabaseAdminClient = ReturnType<typeof createAdminClientType>
type ViMock = ReturnType<typeof vi.fn>

type Chain = {
  eq: ViMock
  insert?: ViMock
  maybeSingle?: ViMock
  select?: ViMock
  single?: ViMock
  update?: ViMock
}

const currentUser = {
  cargo_rol: 'BusinessUser',
  email: 'learner@example.com',
  id: 'user-1',
  username: 'learner',
} as Awaited<ReturnType<typeof SessionService.getCurrentUser>>

describe('POST /api/profile/delete-account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects anonymous requests', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue(null)

    const response = await POST(createRequest({ confirmation: 'delete' }))

    expect(response.status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('rejects requests when confirmation does not match', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue(currentUser)

    const response = await POST(createRequest({ confirmation: 'wrong' }))

    expect(response.status).toBe(400)
    expect(createAdminClient).not.toHaveBeenCalled()
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      'privacy-deletion-requested',
      expect.objectContaining({
        actorId: 'user-1',
        result: 'denied',
      }),
    )
  })

  it('creates a pending deletion request keyed by subject_user_id', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue(currentUser)

    const existingRequestChain = createExistingRequestChain(null)
    const insertChain = createInsertChain('2026-06-17T10:00:00.000Z')
    const refreshTokenRevokeChain = createUpdateChain()
    const legacySessionRevokeChain = createUpdateChain()

    vi.mocked(createAdminClient)
      .mockReturnValueOnce(clientFromChains(existingRequestChain, insertChain))
      .mockReturnValueOnce(clientFromChains(refreshTokenRevokeChain, legacySessionRevokeChain))

    const response = await POST(
      createRequest(
        { confirmation: 'learner@example.com', reason: 'privacy request' },
        {
          'cf-connecting-ip': '203.0.113.10',
          'user-agent': 'vitest',
        },
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      scheduledDeletionAt: '2026-06-17T10:00:00.000Z',
      status: 'pending',
      success: true,
    })
    expect(existingRequestChain.eq).toHaveBeenCalledWith('subject_user_id', 'user-1')
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        requester_ip: '203.0.113.10',
        subject_user_id: 'user-1',
        user_agent: 'vitest',
        user_id: 'user-1',
      }),
    )
    expect(refreshTokenRevokeChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_revoked: true }),
    )
    expect(legacySessionRevokeChain.update).toHaveBeenCalledWith({ revoked: true })
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      'privacy-deletion-requested',
      expect.objectContaining({
        actorId: 'user-1',
        resourceId: 'user-1',
      }),
    )
  })
})

function createRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return new NextRequest('http://localhost:3000/api/profile/delete-account', {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    method: 'POST',
  })
}

function createExistingRequestChain(data: unknown): Chain {
  const chain = {} as Chain
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(async () => ({ data, error: null }))
  return chain
}

function createInsertChain(scheduledDeletionAt: string): Chain {
  const chain = {} as Chain
  chain.insert = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.single = vi.fn(async () => ({
    data: { scheduled_deletion_at: scheduledDeletionAt },
    error: null,
  }))
  chain.eq = vi.fn(() => chain)
  return chain
}

function createUpdateChain(): Chain {
  const chain = {} as Chain
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  return chain
}

function clientFromChains(...chains: Chain[]): SupabaseAdminClient {
  const from = vi.fn()
  chains.forEach((chain) => {
    from.mockReturnValueOnce(chain)
  })

  return { from } as unknown as SupabaseAdminClient
}
