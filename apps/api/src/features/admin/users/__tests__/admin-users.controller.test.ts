import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { createAdminUsersController } from '../admin-users.controller'
import type {
  AdminUserListResult,
  AdminUserSoftDeleteResult,
  AdminUserStats,
} from '../admin-users.types'

function createResponse() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }

  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
}

describe('admin users controller', () => {
  it('returns paginated users', async () => {
    const service = {
      getUsers: vi.fn().mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
      } satisfies AdminUserListResult),
      getStats: vi.fn(),
      getUserById: vi.fn(),
      updateUser: vi.fn(),
      updateUserRole: vi.fn(),
      softDeleteUser: vi.fn(),
    }
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
    const service = {
      getUsers: vi.fn(),
      getStats: vi.fn().mockResolvedValue({
        total_users: 10,
        active_users: 7,
        banned_users: 1,
        verified_users: 8,
        role_distribution: [],
        organization_distribution: [],
      } satisfies AdminUserStats),
      getUserById: vi.fn(),
      updateUser: vi.fn(),
      updateUserRole: vi.fn(),
      softDeleteUser: vi.fn(),
    }
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
    const service = {
      getUsers: vi.fn(),
      getStats: vi.fn(),
      getUserById: vi.fn(),
      updateUser: vi.fn(),
      updateUserRole: vi.fn(),
      softDeleteUser: vi.fn().mockResolvedValue({
        user_id: 'user-2',
        banned_at: '2026-04-02T12:00:00.000Z',
        reason: 'deleted_by_admin',
      } satisfies AdminUserSoftDeleteResult),
    }
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
    const service = {
      getUsers: vi.fn(),
      getStats: vi.fn(),
      getUserById: vi.fn(),
      updateUser: vi.fn(),
      updateUserRole: vi.fn(),
      softDeleteUser: vi.fn(),
    }
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
