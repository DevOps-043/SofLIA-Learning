'use client'

import { useCallback } from 'react'
import { logger } from '@/lib/logger'
import type {
  NotificationCountResponse,
  NotificationListResponse,
} from './notification-context.types'
import type { Notification } from '../services/notification.service'

type RevalidateNotificationState = () => Promise<void>
type MutateNotifications = (
  data?:
    | NotificationListResponse
    | Promise<NotificationListResponse | undefined>
    | ((
        currentData: NotificationListResponse | undefined,
      ) => NotificationListResponse | undefined),
  options?: { revalidate?: boolean },
) => Promise<NotificationListResponse | undefined>
type MutateCount = (
  data?:
    | NotificationCountResponse
    | Promise<NotificationCountResponse | undefined>
    | ((
        currentData: NotificationCountResponse | undefined,
      ) => NotificationCountResponse | undefined),
  options?: { revalidate?: boolean },
) => Promise<NotificationCountResponse | undefined>

type MutationErrorResponse = {
  error?: unknown
  message?: unknown
}

async function readMutationError(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const data = await response.json() as MutationErrorResponse
    const responseMessage =
      typeof data.error === 'string'
        ? data.error
        : typeof data.message === 'string'
          ? data.message
          : null

    return responseMessage || fallbackMessage
  } catch {
    return fallbackMessage
  }
}

export function useNotificationActions(
  revalidateNotificationState: RevalidateNotificationState,
  mutateNotifications: MutateNotifications,
  mutateCount: MutateCount,
) {
  const decrementUnreadCount = useCallback(
    (notification?: Notification) => {
      if (!notification) return

      void mutateCount((currentData) => {
        if (!currentData?.data) return currentData

        const decrementCritical =
          notification?.priority === 'critical' && notification.status === 'unread'
            ? 1
            : 0
        const decrementHigh =
          notification?.priority === 'high' && notification.status === 'unread'
            ? 1
            : 0
        const shouldDecrementTotal = notification.status === 'unread'

        return {
          ...currentData,
          data: {
            critical: Math.max(0, currentData.data.critical - decrementCritical),
            high: Math.max(0, currentData.data.high - decrementHigh),
            total: Math.max(0, currentData.data.total - (shouldDecrementTotal ? 1 : 0)),
          },
        }
      }, { revalidate: false })
    },
    [mutateCount],
  )

  const removeFromUnreadList = useCallback(
    (notificationId: string) => {
      let removedNotification: Notification | undefined

      void mutateNotifications((currentData) => {
        if (!currentData?.data?.notifications) return currentData

        const nextNotifications = currentData.data.notifications.filter((notification) => {
          if (notification.notification_id === notificationId) {
            removedNotification = notification
            return false
          }

          return true
        })

        return {
          ...currentData,
          data: {
            ...currentData.data,
            notifications: nextNotifications,
            total: Math.max(0, currentData.data.total - (removedNotification ? 1 : 0)),
          },
        }
      }, { revalidate: false })

      decrementUnreadCount(removedNotification)
    },
    [decrementUnreadCount, mutateNotifications],
  )

  const clearUnreadState = useCallback(() => {
    void mutateNotifications((currentData) => {
      if (!currentData?.data) return currentData

      return {
        ...currentData,
        data: {
          ...currentData.data,
          notifications: [],
          total: 0,
        },
      }
    }, { revalidate: false })

    void mutateCount((currentData) => {
      if (!currentData?.data) return currentData

      return {
        ...currentData,
        data: {
          critical: 0,
          high: 0,
          total: 0,
        },
      }
    }, { revalidate: false })
  }, [mutateCount, mutateNotifications])

  const requestMutation = useCallback(
    async (
      url: string,
      method: string,
      errorMessage: string,
      optimisticUpdate?: () => void,
    ) => {
      optimisticUpdate?.()

      try {
        const response = await fetch(url, { method, credentials: 'include' })

        if (!response.ok) {
          throw new Error(await readMutationError(response, errorMessage))
        }
      } catch (error) {
        await revalidateNotificationState().catch((revalidationError) => {
          logger.warn('Notification rollback revalidation failed', revalidationError)
        })
        throw error
      }

      void revalidateNotificationState().catch((error) => {
        logger.warn('Notification state revalidation failed after mutation', error)
      })
    },
    [revalidateNotificationState],
  )

  return {
    archiveNotification(notificationId: string) {
      return requestMutation(
        `/api/notifications/${notificationId}/archive`,
        'POST',
        'Error al archivar notificacion',
        () => removeFromUnreadList(notificationId),
      )
    },
    deleteNotification(notificationId: string) {
      return requestMutation(
        `/api/notifications/${notificationId}`,
        'DELETE',
        'Error al eliminar notificacion',
        () => removeFromUnreadList(notificationId),
      )
    },
    markAllAsRead() {
      return requestMutation(
        '/api/notifications/mark-all-read',
        'POST',
        'Error al marcar todas como leidas',
        clearUnreadState,
      )
    },
    markAsRead(notificationId: string) {
      return requestMutation(
        `/api/notifications/${notificationId}/read`,
        'POST',
        'Error al marcar notificacion como leida',
        () => removeFromUnreadList(notificationId),
      )
    },
  }
}
