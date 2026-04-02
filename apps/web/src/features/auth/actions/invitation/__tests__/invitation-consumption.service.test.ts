import { describe, expect, it, vi } from 'vitest'

import {
  consumeBulkInvitation,
  consumeInvitation,
} from '../invitation-consumption.service'
import { createInvitationRepositoryMock, createInvitationRuntimeMock } from './test-helpers'

describe('invitation-consumption.service', () => {
  it('treats missing classic invitations as idempotent success', async () => {
    const repo = createInvitationRepositoryMock({
      getInvitationForConsume: vi.fn(async () => null),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(
      consumeInvitation('missing', 'org-1', 'user-1', runtime)
    ).resolves.toEqual({
      success: true,
    })
    expect(runtime.logger.warn).toHaveBeenCalled()
  })

  it('blocks bulk consumption without an authenticated session', async () => {
    const repo = createInvitationRepositoryMock({
      resolveAuthenticatedUserId: vi.fn(async () => null),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(consumeBulkInvitation('token-1', 'user-1', runtime)).resolves.toEqual({
      error: 'No autenticado. Por favor inicia sesion.',
      success: false,
    })
  })

  it('blocks bulk consumption when the session user does not match the request', async () => {
    const repo = createInvitationRepositoryMock({
      resolveAuthenticatedUserId: vi.fn(async () => 'user-2'),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(consumeBulkInvitation('token-1', 'user-1', runtime)).resolves.toEqual({
      error: 'No autorizado.',
      success: false,
    })
  })

  it('expires bulk links that are already outdated', async () => {
    const repo = createInvitationRepositoryMock({
      getBulkInviteLinkByToken: vi.fn(async () => ({
        currentUses: 0,
        expiresAt: '2026-04-01T12:00:00.000Z',
        id: 'link-1',
        maxUses: 10,
        organizationId: 'org-1',
        role: 'member',
        status: 'active',
      })),
      resolveAuthenticatedUserId: vi.fn(async () => 'user-1'),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(consumeBulkInvitation('token-1', 'user-1', runtime)).resolves.toEqual({
      error: 'Este enlace de invitacion ha expirado',
      success: false,
    })
    expect(repo.markBulkInviteLinkStatus).toHaveBeenCalledWith('link-1', 'expired')
  })

  it('marks exhausted links before rejecting new registrations', async () => {
    const repo = createInvitationRepositoryMock({
      getBulkInviteLinkByToken: vi.fn(async () => ({
        currentUses: 3,
        expiresAt: '2026-04-03T12:00:00.000Z',
        id: 'link-1',
        maxUses: 3,
        organizationId: 'org-1',
        role: 'member',
        status: 'active',
      })),
      resolveAuthenticatedUserId: vi.fn(async () => 'user-1'),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(consumeBulkInvitation('token-1', 'user-1', runtime)).resolves.toEqual({
      error: 'Este enlace ha alcanzado el limite de registros',
      success: false,
    })
    expect(repo.markBulkInviteLinkStatus).toHaveBeenCalledWith('link-1', 'exhausted')
  })

  it('creates membership, reserves usage atomically and returns organization slug on success', async () => {
    const repo = createInvitationRepositoryMock({
      getBulkInviteLinkByToken: vi.fn(async () => ({
        currentUses: 1,
        expiresAt: '2026-04-03T12:00:00.000Z',
        id: 'link-1',
        maxUses: 4,
        organizationId: 'org-1',
        role: 'admin',
        status: 'active',
      })),
      getOrganizationSlug: vi.fn(async () => 'soflia'),
      resolveAuthenticatedUserId: vi.fn(async () => 'user-1'),
    })
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(consumeBulkInvitation('token-1', 'user-1', runtime)).resolves.toEqual({
      organizationSlug: 'soflia',
      success: true,
    })
    expect(repo.addOrganizationMembership).toHaveBeenCalledWith({
      joinedAt: '2026-04-02T12:00:00.000Z',
      organizationId: 'org-1',
      role: 'admin',
      status: 'active',
      userId: 'user-1',
    })
    expect(repo.reserveBulkInviteUse).toHaveBeenCalledWith(
      'link-1',
      1,
      2,
      undefined
    )
    expect(repo.setUserBusinessRole).toHaveBeenCalledWith('user-1')
    expect(repo.createBulkInviteRegistration).toHaveBeenCalledWith('link-1', 'user-1')
  })
})
