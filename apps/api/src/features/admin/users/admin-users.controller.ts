import type { Request, RequestHandler, Response } from 'express'

import { UnauthorizedError } from '@/core/errors/app-error'
import { asyncHandler } from '@/core/middleware/error.middleware'

import { AdminUsersService } from './admin-users.service'
import type {
  AdminUserListQuery,
  AdminUserRoleUpdateInput,
  AdminUserUpdateInput,
} from './admin-users.types'

interface AdminUsersController {
  listUsers: RequestHandler
  getStats: RequestHandler
  getUserById: RequestHandler
  updateUser: RequestHandler
  updateUserRole: RequestHandler
  deleteUser: RequestHandler
}

function getAuthenticatedUserId(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError()
  }

  return req.user.id
}

export function createAdminUsersController(
  service: AdminUsersService = new AdminUsersService(),
): AdminUsersController {
  return {
    listUsers: asyncHandler(async (req: Request, res: Response) => {
      const result = await service.getUsers(req.query as unknown as AdminUserListQuery)

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    getStats: asyncHandler(async (_req: Request, res: Response) => {
      const result = await service.getStats()

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    getUserById: asyncHandler(async (req: Request, res: Response) => {
      const result = await service.getUserById(req.params.userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    updateUser: asyncHandler(async (req: Request, res: Response) => {
      getAuthenticatedUserId(req)
      const result = await service.updateUser(
        req.params.userId,
        req.body as AdminUserUpdateInput,
      )

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    updateUserRole: asyncHandler(async (req: Request, res: Response) => {
      const actorUserId = getAuthenticatedUserId(req)
      const result = await service.updateUserRole(
        req.params.userId,
        req.body as AdminUserRoleUpdateInput,
        actorUserId,
      )

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    deleteUser: asyncHandler(async (req: Request, res: Response) => {
      const actorUserId = getAuthenticatedUserId(req)
      const result = await service.softDeleteUser(req.params.userId, actorUserId)

      res.status(200).json({
        success: true,
        data: result,
      })
    }),
  }
}
