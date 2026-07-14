import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingleMock = vi.fn()
const eqMock = vi.fn(() => ({
  maybeSingle: maybeSingleMock,
}))
const selectMock = vi.fn(() => ({
  eq: eqMock,
}))
const fromMock = vi.fn(() => ({
  select: selectMock,
}))

vi.mock('@/core/supabase/service-client', () => ({
  getServiceClient: () => ({
    from: fromMock,
  }),
}))

function createRequest(user?: Request['user']) {
  return { user } as Request
}

describe('admin access middleware', () => {
  beforeEach(() => {
    fromMock.mockClear()
    selectMock.mockClear()
    eqMock.mockClear()
    maybeSingleMock.mockReset()
  })

  it('allows administrators defined in the database', async () => {
    const { requireDatabaseRoles } = await import('../admin-access.middleware')
    const next = vi.fn()

    maybeSingleMock.mockResolvedValue({
      data: {
        platform_role: 'Administrador',
        is_banned: false,
      },
      error: null,
    })

    await requireDatabaseRoles('administrador', 'admin')(
      createRequest({
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'member',
      }),
      {} as Response,
      next,
    )

    expect(next).toHaveBeenCalledWith()
  })

  it('rejects banned users even when they have an admin role', async () => {
    const { requireDatabaseRoles } = await import('../admin-access.middleware')
    const next = vi.fn()

    maybeSingleMock.mockResolvedValue({
      data: {
        platform_role: 'Administrador',
        is_banned: true,
      },
      error: null,
    })

    await requireDatabaseRoles('administrador')(
      createRequest({
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
      }),
      {} as Response,
      next,
    )

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INSUFFICIENT_PERMISSIONS',
        statusCode: 403,
      }),
    )
  })

  it('rejects unauthenticated requests before querying the database', async () => {
    const { requireDatabaseRoles } = await import('../admin-access.middleware')
    const next = vi.fn()

    await requireDatabaseRoles('administrador')(
      createRequest(),
      {} as Response,
      next,
    )

    expect(fromMock).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHENTICATED',
        statusCode: 401,
      }),
    )
  })
})
