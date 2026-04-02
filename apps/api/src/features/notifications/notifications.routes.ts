import { Router } from 'express'

import { authenticate } from '@/core/middleware/auth.middleware'
import { createRateLimiter } from '@/core/middleware/rate-limit.middleware'
import { validateRequest } from '@/core/validation/validate.middleware'

import { createNotificationsController } from './notifications.controller'
import {
  notificationIdParamsSchema,
  notificationListQuerySchema,
} from './notifications.types'

export function createNotificationsRouter() {
  const router = Router()
  const controller = createNotificationsController()
  const writeLimiter = createRateLimiter({
    max: 60,
    windowMs: 60 * 1000,
  })

  router.use(authenticate)

  router.get(
    '/',
    validateRequest({ query: notificationListQuerySchema }),
    controller.listNotifications,
  )
  router.get('/unread-count', controller.getUnreadCount)
  router.patch('/mark-all-read', writeLimiter, controller.markAllNotificationsAsRead)
  router.patch(
    '/:notificationId/read',
    writeLimiter,
    validateRequest({ params: notificationIdParamsSchema }),
    controller.markNotificationAsRead,
  )
  router.patch(
    '/:notificationId/archive',
    writeLimiter,
    validateRequest({ params: notificationIdParamsSchema }),
    controller.archiveNotification,
  )
  router.delete(
    '/:notificationId',
    writeLimiter,
    validateRequest({ params: notificationIdParamsSchema }),
    controller.deleteNotification,
  )

  return router
}
