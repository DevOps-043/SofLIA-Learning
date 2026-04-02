import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const userMaybeSingleMock = vi.fn()
const membershipMaybeSingleMock = vi.fn()
const userEqIdMock = vi.fn(() => ({
  maybeSingle: userMaybeSingleMock,
}))
const userSelectMock = vi.fn(() => ({
  eq: userEqIdMock,
}))
const membershipEqStatusMock = vi.fn(() => ({
  maybeSingle: membershipMaybeSingleMock,
}))
const membershipEqUserMock = vi.fn(() => ({
  eq: membershipEqStatusMock,
}))
const membershipEqOrgMock = vi.fn(() => ({
  eq: membershipEqUserMock,
}))
const membershipSelectMock = vi.fn(() => ({
  eq: membershipEqOrgMock,
}))
const fromMock = vi.fn((table: string) => {
  if (table === 'users') {
    return { select: userSelectMock }
  }

  if (table === 'organization_users') {
    return { select: membershipSelectMock }
  }

  throw new Error(`Unexpected table ${table}`)
})

vi.mock('@/core/supabase/service-client', () => ({
  getServiceClient: () => ({
    from: fromMock,
  }),
}))

function createRequest(params?: Record<string, string>) {
  return {
    params: params ?? {},
    user: {
      id: 'user-1',
      email: 'business@example.com',
      role: 'business',
    },
  } as unknown as Request
}

describe('organization access middleware', () => {
  beforeEach(() => {
    fromMock.mockClear()
    userSelectMock.mockClear()
    membershipSelectMock.mockClear()
    userEqIdMock.mockClear()
    membershipEqOrgMock.mockClear()
    membershipEqUserMock.mockClear()
    membershipEqStatusMock.mockClear()
    userMaybeSingleMock.mockReset()
    membershipMaybeSingleMock.mockReset()
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
