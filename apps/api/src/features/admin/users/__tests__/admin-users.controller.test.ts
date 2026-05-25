import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { createAdminUsersController } from '../admin-users.controller'
import { createControllerServiceMock, createResponse } from './admin-users.fixtures'

describe('admin users controller', () => {
  it('returns paginated users', async () => {
    const service = createControllerServiceMock()
    const controller = createAdminUsersController(service as never)
    const response = createResponse()
    const next = vi.fn()

    await controller.listUsers(
      {
        query: {
          page: 1,
          limit: 20,
        },
      } as Request,
      response,
      next,
    )

    expect(service.getUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns stats for admin dashboards', async () => {
    const service = createControllerServiceMock()
    const controller = createAdminUsersController(service as never)
    const response = createResponse()
    const next = vi.fn()

    await controller.getStats({} as Request, response, next)

    expect(service.getStats).toHaveBeenCalledWith()
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('soft deletes users using the authenticated actor id', async () => {
    const service = createControllerServiceMock()
    const controller = createAdminUsersController(service as never)
    const response = createResponse()
    const next = vi.fn()

    await controller.deleteUser(
      {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin',
        },
        params: {
          userId: 'user-2',
        },
      } as unknown as Request,
      response,
      next,
    )

    expect(service.softDeleteUser).toHaveBeenCalledWith('user-2', 'admin-1')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(next).not.toHaveBeenCalled()
  })

  it('forwards missing-auth errors to next', async () => {
    const service = createControllerServiceMock()
    const controller = createAdminUsersController(service as never)
    const response = createResponse()
    const next = vi.fn()

    await controller.deleteUser(
      {
        params: {
          userId: 'user-2',
        },
      } as unknown as Request,
      response,
      next,
    )

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHENTICATED',
        statusCode: 401,
      }),
    )
  })
})
