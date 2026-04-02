import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { requireRoles } from '../role.middleware'

function createResponse(): Response {
  return {} as Response
}

describe('role middleware', () => {
  it('rejects unauthenticated requests', () => {
    const middleware = requireRoles('admin')
    const next = vi.fn()

    middleware({} as Request, createResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHENTICATED',
        statusCode: 401,
      }),
    )
  })

  it('rejects users without the required role', () => {
    const middleware = requireRoles('admin')
    const next = vi.fn()

    middleware(
      {
        user: {
          id: 'user-1',
          email: 'member@example.com',
          role: 'member',
        },
      } as Request,
      createResponse(),
      next,
    )

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INSUFFICIENT_PERMISSIONS',
        statusCode: 403,
      }),
    )
  })

  it('accepts matching roles case-insensitively', () => {
    const middleware = requireRoles('Admin')
    const next = vi.fn()

    middleware(
      {
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          role: 'admin',
        },
      } as Request,
      createResponse(),
      next,
    )

    expect(next).toHaveBeenCalledWith()
  })
})
