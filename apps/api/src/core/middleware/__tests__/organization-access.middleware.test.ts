import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createRequest,
  fromMock,
  membershipEqOrgMock,
  membershipEqStatusMock,
  membershipEqUserMock,
  membershipMaybeSingleMock,
  membershipSelectMock,
  resetOrganizationAccessMocks,
  userEqIdMock,
  userMaybeSingleMock,
  userSelectMock,
} from './organization-access.fixtures'

vi.mock('@/core/supabase/service-client', () => ({
  getServiceClient: () => ({
    from: fromMock,
  }),
}))

describe('organization access middleware', () => {
  beforeEach(() => {
    resetOrganizationAccessMocks()
  })

  it('allows active organization members', async () => {
    const { requireOrganizationAccess } = await import('../organization-access.middleware')
    const next = vi.fn()

    userMaybeSingleMock.mockResolvedValue({
      data: { cargo_rol: 'Business', is_banned: false },
      error: null,
    })
    membershipMaybeSingleMock.mockResolvedValue({
      data: { role: 'member' },
      error: null,
    })

    await requireOrganizationAccess()(createRequest({ orgId: 'org-1' }), {} as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('allows platform admins without direct membership', async () => {
    const { requireOrganizationAccess } = await import('../organization-access.middleware')
    const next = vi.fn()

    userMaybeSingleMock.mockResolvedValue({
      data: { cargo_rol: 'Administrador', is_banned: false },
      error: null,
    })
    membershipMaybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    })

    await requireOrganizationAccess()(createRequest({ orgId: 'org-1' }), {} as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('rejects banned users', async () => {
    const { requireOrganizationAccess } = await import('../organization-access.middleware')
    const next = vi.fn()

    userMaybeSingleMock.mockResolvedValue({
      data: { cargo_rol: 'Business', is_banned: true },
      error: null,
    })
    membershipMaybeSingleMock.mockResolvedValue({
      data: { role: 'member' },
      error: null,
    })

    await requireOrganizationAccess()(createRequest({ orgId: 'org-1' }), {} as Response, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INSUFFICIENT_PERMISSIONS',
        statusCode: 403,
      }),
    )
  })

  it('rejects users without organization access', async () => {
    const { requireOrganizationAccess } = await import('../organization-access.middleware')
    const next = vi.fn()

    userMaybeSingleMock.mockResolvedValue({
      data: { cargo_rol: 'Business', is_banned: false },
      error: null,
    })
    membershipMaybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    })

    await requireOrganizationAccess()(createRequest({ orgId: 'org-1' }), {} as Response, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INSUFFICIENT_PERMISSIONS',
        statusCode: 403,
      }),
    )
  })
})
