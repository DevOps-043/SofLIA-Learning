'use client'

import { useCallback } from 'react'
import { logger } from '@/lib/logger'

type RevalidateNotificationState = () => Promise<void>

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
) {
  const requestMutation = useCallback(
    async (url: string, method: string, errorMessage: string) => {
      const response = await fetch(url, { method, credentials: 'include' })

      if (!response.ok) {
        throw new Error(await readMutationError(response, errorMessage))
      }

      try {
        await revalidateNotificationState()
      } catch (error) {
        logger.warn('Notification state revalidation failed after mutation', error)
      }
    },
    [revalidateNotificationState],
  )

  return {
    archiveNotification(notificationId: string) {
      return requestMutation(
        `/api/notifications/${notificationId}/archive`,
        'POST',
        'Error al archivar notificacion',
      )
    },
    deleteNotification(notificationId: string) {
      return requestMutation(
        `/api/notifications/${notificationId}`,
        'DELETE',
        'Error al eliminar notificacion',
      )
    },
    markAllAsRead() {
      return requestMutation(
        '/api/notifications/mark-all-read',
        'POST',
        'Error al marcar todas como leidas',
      )
    },
    markAsRead(notificationId: string) {
      return requestMutation(
        `/api/notifications/${notificationId}/read`,
        'POST',
        'Error al marcar notificacion como leida',
      )
    },
  }
}
