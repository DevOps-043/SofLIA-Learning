import type { Request, RequestHandler, Response } from 'express'

import { UnauthorizedError } from '@/core/errors/app-error'
import { asyncHandler } from '@/core/middleware/error.middleware'

import { NotificationService } from './notifications.service'
import type { NotificationListQuery } from './notifications.types'

interface NotificationsController {
  listNotifications: RequestHandler
  getUnreadCount: RequestHandler
  markNotificationAsRead: RequestHandler
  markAllNotificationsAsRead: RequestHandler
  archiveNotification: RequestHandler
  deleteNotification: RequestHandler
}

function getAuthenticatedUserId(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError()
  }

  return req.user.id
}

export function createNotificationsController(
  service: NotificationService = new NotificationService(),
): NotificationsController {
  return {
    listNotifications: asyncHandler(async (req: Request, res: Response) => {
      const query = req.query as unknown as NotificationListQuery
      const userId = getAuthenticatedUserId(req)
      const result = await service.getUserNotifications(userId, query)

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    getUnreadCount: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const counts = await service.getUnreadCount(userId)

      res.status(200).json({
        success: true,
        data: counts,
      })
    }),

    markNotificationAsRead: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const notification = await service.markAsRead(
        req.params.notificationId,
        userId,
      )

      res.status(200).json({
        success: true,
        data: notification,
      })
    }),

    markAllNotificationsAsRead: asyncHandler(
      async (req: Request, res: Response) => {
        const userId = getAuthenticatedUserId(req)
        const result = await service.markAllAsRead(userId)

        res.status(200).json({
          success: true,
          data: result,
        })
      },
    ),

    archiveNotification: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const notification = await service.archiveNotification(
        req.params.notificationId,
        userId,
      )

      res.status(200).json({
        success: true,
        data: notification,
      })
    }),

    deleteNotification: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      await service.deleteNotification(req.params.notificationId, userId)
      res.status(204).send()
    }),
  }
}
