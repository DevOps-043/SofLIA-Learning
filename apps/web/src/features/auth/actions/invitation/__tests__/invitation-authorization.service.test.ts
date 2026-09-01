import { describe, expect, it, vi } from 'vitest'

import { resendInvitation } from '../invitation-management.service'
import { inviteUser } from '../invite-user.service'
import {
  createInvitationRepositoryMock,
  createInvitationRuntimeMock,
} from './test-helpers'

const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001'

describe('invitation authorization and delivery', () => {
  it('does not query or create invitations for a non-admin actor', async () => {
    const repo = createInvitationRepositoryMock()
    const runtime = createInvitationRuntimeMock({
      authorizeOrganizationAdmin: vi.fn(async () => null),
      repo,
    })

    await expect(
      inviteUser(
        { email: 'member@example.com', organizationId: ORGANIZATION_ID },
        runtime,
      ),
    ).resolves.toMatchObject({ success: false })
    expect(repo.findUserByEmail).not.toHaveBeenCalled()
    expect(repo.createInvitation).not.toHaveBeenCalled()
  })

  it('prevents an organization admin from assigning the owner role', async () => {
    const repo = createInvitationRepositoryMock()
    const runtime = createInvitationRuntimeMock({
      authorizeOrganizationAdmin: vi.fn(async () => ({
        canAssignOwner: false,
        userId: 'admin-1',
      })),
      repo,
    })

    await expect(
      inviteUser(
        {
          email: 'owner@example.com',
          organizationId: ORGANIZATION_ID,
          role: 'owner',
        },
        runtime,
      ),
    ).resolves.toMatchObject({ success: false })
    expect(repo.createInvitation).not.toHaveBeenCalled()
  })

  it('attributes the invitation to the authenticated administrator', async () => {
    const repo = createInvitationRepositoryMock()
    const runtime = createInvitationRuntimeMock({ repo })

    await expect(
      inviteUser(
        { email: 'member@example.com', organizationId: ORGANIZATION_ID },
        runtime,
      ),
    ).resolves.toEqual({ invitationId: 'inv-1', success: true })
    expect(repo.createInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'admin-1' }),
    )
  })

  it('revokes a newly-created invitation if email delivery fails', async () => {
    const repo = createInvitationRepositoryMock()
    const runtime = createInvitationRuntimeMock({ repo })
    vi.mocked(
      runtime.emailService.sendOrganizationInvitationEmail,
    ).mockRejectedValue(new Error('provider unavailable'))

    await expect(
      inviteUser(
        { email: 'member@example.com', organizationId: ORGANIZATION_ID },
        runtime,
      ),
    ).resolves.toMatchObject({ success: false })
    expect(repo.revokePendingInvitation).toHaveBeenCalledWith('inv-1')
  })

  it('restores the previous token if resend delivery fails', async () => {
    const repo = createInvitationRepositoryMock({
      getInvitationById: vi.fn(async () => ({
        createdAt: '2026-04-01T12:00:00.000Z',
        email: 'member@example.com',
        expiresAt: '2026-04-08T12:00:00.000Z',
        id: 'inv-1',
        metadata: null,
        organization: { name: 'Acme', slug: 'acme' },
        organizationId: ORGANIZATION_ID,
        role: 'member',
        status: 'pending',
        token: 'old-token',
      })),
    })
    const runtime = createInvitationRuntimeMock({ repo })
    vi.mocked(
      runtime.emailService.sendOrganizationInvitationEmail,
    ).mockRejectedValue(new Error('provider unavailable'))

    await expect(resendInvitation('inv-1', runtime)).resolves.toEqual({
      error: 'Error enviando email',
      success: false,
    })
    expect(repo.refreshInvitation).toHaveBeenLastCalledWith(
      'inv-1',
      'old-token',
      '2026-04-08T12:00:00.000Z',
    )
  })
})
