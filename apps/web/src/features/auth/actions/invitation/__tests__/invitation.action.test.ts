import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const invitationServiceMocks = vi.hoisted(() => {
  const createInvitationRuntimeMock = vi.fn()

  return {
    consumeBulkInvitation: vi.fn(),
    consumeInvitation: vi.fn(),
    createInvitationRuntime: createInvitationRuntimeMock,
    findInvitationByEmail: vi.fn(),
    inviteUser: vi.fn(),
    listOrganizationInvitations: vi.fn(),
    resendInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
    validateInvitation: vi.fn(),
  }
})

vi.mock('../index', () => invitationServiceMocks)

import {
  consumeBulkInvitationAction,
  consumeInvitationAction,
  findInvitationByEmailAction,
  inviteUserAction,
  listOrganizationInvitationsAction,
  resendInvitationAction,
  revokeInvitationAction,
  validateInvitationAction,
} from '../../invitation'

describe('invitation actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invitationServiceMocks.createInvitationRuntime.mockResolvedValue({ runtime: true })
  })

  it('delegates invite creation through the invitation runtime', async () => {
    invitationServiceMocks.inviteUser.mockResolvedValue({
      invitationId: 'inv-1',
      success: true,
    })

    await expect(
      inviteUserAction({
        email: 'ada@test.com',
        organizationId: '6f67b528-2d7a-4f0e-8585-5dd8e0bd0b52',
        role: 'admin',
      })
    ).resolves.toEqual({
      invitationId: 'inv-1',
      success: true,
    })

    expect(invitationServiceMocks.inviteUser).toHaveBeenCalledWith(
      {
        email: 'ada@test.com',
        organizationId: '6f67b528-2d7a-4f0e-8585-5dd8e0bd0b52',
        role: 'admin',
      },
      { runtime: true }
    )
  })

  it('rejects malformed invitation tokens before creating the runtime', async () => {
    await expect(validateInvitationAction('invalid-token')).resolves.toEqual({
      error: 'Token invalido',
      valid: false,
    })

    expect(invitationServiceMocks.createInvitationRuntime).not.toHaveBeenCalled()
    expect(invitationServiceMocks.validateInvitation).not.toHaveBeenCalled()
  })

  it('rejects malformed bulk invite tokens before creating the runtime', async () => {
    await expect(consumeBulkInvitationAction('invalid-token', 'user-1')).resolves.toEqual({
      error: 'Token invalido',
      success: false,
    })

    expect(invitationServiceMocks.createInvitationRuntime).not.toHaveBeenCalled()
    expect(invitationServiceMocks.consumeBulkInvitation).not.toHaveBeenCalled()
  })

  it('delegates validation and lookup workflows after parsing input', async () => {
    const token = 'a'.repeat(64)
    invitationServiceMocks.validateInvitation.mockResolvedValue({
      email: 'ada@test.com',
      valid: true,
    })
    invitationServiceMocks.findInvitationByEmail.mockResolvedValue({
      hasInvitation: true,
      role: 'member',
    })

    await expect(validateInvitationAction(token)).resolves.toEqual({
      email: 'ada@test.com',
      valid: true,
    })
    await expect(findInvitationByEmailAction('ada@test.com', 'org-1')).resolves.toEqual({
      hasInvitation: true,
      role: 'member',
    })

    expect(invitationServiceMocks.validateInvitation).toHaveBeenCalledWith(
      token,
      { runtime: true }
    )
    expect(invitationServiceMocks.findInvitationByEmail).toHaveBeenCalledWith(
      'ada@test.com',
      'org-1',
      { runtime: true }
    )
  })

  it('routes consume and management actions through the facade', async () => {
    const token = 'b'.repeat(64)
    invitationServiceMocks.consumeInvitation.mockResolvedValue({ success: true })
    invitationServiceMocks.listOrganizationInvitations.mockResolvedValue({
      invitations: [],
      success: true,
    })
    invitationServiceMocks.revokeInvitation.mockResolvedValue({ success: true })
    invitationServiceMocks.resendInvitation.mockResolvedValue({ success: true })
    invitationServiceMocks.consumeBulkInvitation.mockResolvedValue({
      organizationSlug: 'soflia',
      success: true,
    })

    await expect(
      consumeInvitationAction('ada@test.com', 'org-1', 'user-1')
    ).resolves.toEqual({ success: true })
    await expect(
      listOrganizationInvitationsAction('org-1', 'pending')
    ).resolves.toEqual({
      invitations: [],
      success: true,
    })
    await expect(revokeInvitationAction('inv-1')).resolves.toEqual({ success: true })
    await expect(resendInvitationAction('inv-1')).resolves.toEqual({ success: true })
    await expect(consumeBulkInvitationAction(token, 'user-1')).resolves.toEqual({
      organizationSlug: 'soflia',
      success: true,
    })

    expect(invitationServiceMocks.consumeInvitation).toHaveBeenCalledWith(
      'ada@test.com',
      'org-1',
      'user-1',
      { runtime: true }
    )
    expect(invitationServiceMocks.listOrganizationInvitations).toHaveBeenCalledWith(
      'org-1',
      'pending',
      { runtime: true }
    )
    expect(invitationServiceMocks.revokeInvitation).toHaveBeenCalledWith(
      'inv-1',
      { runtime: true }
    )
    expect(invitationServiceMocks.resendInvitation).toHaveBeenCalledWith(
      'inv-1',
      { runtime: true }
    )
    expect(invitationServiceMocks.consumeBulkInvitation).toHaveBeenCalledWith(
      token,
      'user-1',
      { runtime: true }
    )
  })
})
