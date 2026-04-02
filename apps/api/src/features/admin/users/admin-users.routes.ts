import { Router } from 'express'

import { requireDatabaseRoles } from '@/core/middleware/admin-access.middleware'
import { authenticate } from '@/core/middleware/auth.middleware'
import { createRateLimiter } from '@/core/middleware/rate-limit.middleware'
import { validateRequest } from '@/core/validation/validate.middleware'

import { createAdminUsersController } from './admin-users.controller'
import {
  adminUserIdParamsSchema,
  adminUserListQuerySchema,
  adminUserRoleBodySchema,
  adminUserUpdateBodySchema,
} from './admin-users.types'

export function createAdminUsersRouter() {
  const router = Router()
  const controller = createAdminUsersController()
  const writeLimiter = createRateLimiter({
    max: 30,
    windowMs: 60 * 1000,
  })

  router.use(authenticate)
  router.use(requireDatabaseRoles('administrador', 'admin', 'superadmin'))

  router.get(
    '/',
    validateRequest({ query: adminUserListQuerySchema }),
    controller.listUsers,
  )
  router.get('/stats', controller.getStats)
  router.get(
    '/:userId',
    validateRequest({ params: adminUserIdParamsSchema }),
    controller.getUserById,
  )
  router.patch(
    '/:userId',
    writeLimiter,
    validateRequest({
      params: adminUserIdParamsSchema,
      body: adminUserUpdateBodySchema,
    }),
    controller.updateUser,
  )
  router.patch(
    '/:userId/role',
    writeLimiter,
    validateRequest({
      params: adminUserIdParamsSchema,
      body: adminUserRoleBodySchema,
    }),
    controller.updateUserRole,
  )
  router.delete(
    '/:userId',
    writeLimiter,
    validateRequest({ params: adminUserIdParamsSchema }),
    controller.deleteUser,
  )

  return router
}
