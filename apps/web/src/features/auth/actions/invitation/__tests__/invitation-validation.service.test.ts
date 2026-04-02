import { describe, expect, it, vi } from 'vitest'

import {
  findInvitationByEmail,
  validateInvitation,
} from '../invitation-validation.service'
import { createInvitationRepositoryMock, createInvitationRuntimeMock } from './test-helpers'

describe('invitation-validation.service', () => {
  it('returns invitation context for pending tokens', async () => {
    const repo = createInvitationRepositoryMock({
      getInvitationByToken: vi.fn(async () => ({
        createdAt: null,
        email: 'ada@test.com',
        expiresAt: '2026-04-05T12:00:00.000Z',
        id: 'inv-1',
        metadata: { position: 'CTO' },
        organization: { name: 'SofLIA', slug: 'soflia' },
        organizationId: 'org-1',
        role: 'admin',
        status: 'pending',
        token: 'a'.repeat(64),
      })),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(validateInvitation('a'.repeat(64), runtime)).resolves.toEqual({
      email: 'ada@test.com',
      organizationId: 'org-1',
      organizationName: 'SofLIA',
      organizationSlug: 'soflia',
      position: 'CTO',
      role: 'admin',
      valid: true,
    })
  })

  it('rejects accepted invitations without mutating state', async () => {
    const repo = createInvitationRepositoryMock({
      getInvitationByToken: vi.fn(async () => ({
        createdAt: null,
        email: 'ada@test.com',
        expiresAt: '2026-04-05T12:00:00.000Z',
        id: 'inv-1',
        metadata: null,
        organizationId: 'org-1',
        role: 'admin',
        status: 'accepted',
        token: 'a'.repeat(64),
      })),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(validateInvitation('a'.repeat(64), runtime)).resolves.toEqual({
      error: 'Esta invitacion ya fue utilizada',
      valid: false,
    })
    expect(repo.markInvitationExpired).not.toHaveBeenCalled()
  })

  it('expires outdated invitations during validation', async () => {
    const repo = createInvitationRepositoryMock({
      getInvitationByToken: vi.fn(async () => ({
        createdAt: null,
        email: 'ada@test.com',
        expiresAt: '2026-04-01T12:00:00.000Z',
        id: 'inv-1',
        metadata: null,
        organizationId: 'org-1',
        role: 'member',
        status: 'pending',
        token: 'a'.repeat(64),
      })),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(validateInvitation('a'.repeat(64), runtime)).resolves.toEqual({
      error: 'Esta invitacion ha expirado',
      valid: false,
    })
    expect(repo.markInvitationExpired).toHaveBeenCalledWith('inv-1')
  })

  it('expires outdated email lookups and reports no active invitation', async () => {
    const repo = createInvitationRepositoryMock({
      findPendingInvitationByEmail: vi.fn(async () => ({
        createdAt: null,
        email: 'ada@test.com',
        expiresAt: '2026-04-01T12:00:00.000Z',
        id: 'inv-1',
        metadata: { position: 'CTO' },
        organizationId: 'org-1',
        role: 'member',
        status: 'pending',
        token: 'a'.repeat(64),
      })),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(
      findInvitationByEmail('ada@test.com', 'org-1', runtime)
    ).resolves.toEqual({
      error: 'La invitacion ha expirado',
      hasInvitation: false,
    })
    expect(repo.markInvitationExpired).toHaveBeenCalledWith('inv-1')
  })
})
