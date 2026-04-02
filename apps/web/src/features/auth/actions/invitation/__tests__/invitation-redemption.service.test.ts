import { describe, expect, it, vi } from 'vitest'

import { finalizeBulkInviteRegistration } from '../invitation-redemption.service'
import { validateBulkInviteRegistration } from '../invitation-validation.service'
import { createInvitationRepositoryMock } from './test-helpers'

describe('invitation bulk validation', () => {
  it('expires outdated bulk links and persists the expired status', async () => {
    const repo = createInvitationRepositoryMock({
      getBulkInviteLinkByToken: vi.fn(async () => ({
        currentUses: 0,
        expiresAt: '2026-04-01T12:00:00.000Z',
        id: 'bulk-1',
        maxUses: 3,
        organizationId: 'org-1',
        role: 'member',
        status: 'active',
      })),
    })

    await expect(
      validateBulkInviteRegistration(
        repo,
        'bulk-token',
        'org-1',
        new Date('2026-04-02T12:00:00.000Z')
      )
    ).resolves.toEqual({
      error: 'Este enlace de invitacion ha expirado',
      valid: false,
    })
    expect(repo.markBulkInviteLinkStatus).toHaveBeenCalledWith(
      'bulk-1',
      'expired'
    )
  })

  it('returns a normalized role for valid bulk invite links', async () => {
    const repo = createInvitationRepositoryMock({
      getBulkInviteLinkByToken: vi.fn(async () => ({
        currentUses: 1,
        expiresAt: '2026-04-09T12:00:00.000Z',
        id: 'bulk-2',
        maxUses: 4,
        organizationId: 'org-1',
        role: null,
        status: 'active',
      })),
    })

    await expect(
      validateBulkInviteRegistration(
        repo,
        'bulk-token',
        'org-1',
        new Date('2026-04-02T12:00:00.000Z')
      )
    ).resolves.toEqual({
      role: 'member',
      valid: true,
    })
  })
})

describe('invitation redemption service', () => {
  it('consumes the last available bulk invite and exhausts the link', async () => {
    const repo = createInvitationRepositoryMock({
      getBulkInviteLinkByToken: vi.fn(async () => ({
        currentUses: 1,
        expiresAt: '2026-04-09T12:00:00.000Z',
        id: 'bulk-3',
        maxUses: 2,
        organizationId: 'org-1',
        role: 'admin',
        status: 'active',
      })),
    })

    await expect(
      finalizeBulkInviteRegistration(
        repo,
        'bulk-token',
        'org-1',
        'user-1',
        new Date('2026-04-02T12:00:00.000Z')
      )
    ).resolves.toEqual({ success: true })
    expect(repo.reserveBulkInviteUse).toHaveBeenCalledWith(
      'bulk-3',
      1,
      2,
      'exhausted'
    )
    expect(repo.createBulkInviteRegistration).toHaveBeenCalledWith(
      'bulk-3',
      'user-1'
    )
  })

  it('surfaces a race condition when the reservation no longer fits the latest state', async () => {
    const repo = createInvitationRepositoryMock({
      getBulkInviteLinkByToken: vi
        .fn()
        .mockResolvedValueOnce({
          currentUses: 1,
          expiresAt: '2026-04-09T12:00:00.000Z',
          id: 'bulk-4',
          maxUses: 2,
          organizationId: 'org-1',
          role: 'admin',
          status: 'active',
        })
        .mockResolvedValueOnce({
          currentUses: 2,
          expiresAt: '2026-04-09T12:00:00.000Z',
          id: 'bulk-4',
          maxUses: 2,
          organizationId: 'org-1',
          role: 'admin',
          status: 'active',
        }),
      reserveBulkInviteUse: vi.fn(async () => false),
    })

    await expect(
      finalizeBulkInviteRegistration(
        repo,
        'bulk-token',
        'org-1',
        'user-1',
        new Date('2026-04-02T12:00:00.000Z')
      )
    ).resolves.toEqual({
      error: 'Este enlace ha alcanzado el limite de registros',
      success: false,
    })
    expect(repo.markBulkInviteLinkStatus).toHaveBeenCalledWith(
      'bulk-4',
      'exhausted'
    )
  })
})
