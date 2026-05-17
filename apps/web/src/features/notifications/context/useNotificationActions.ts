'use client'

import { useCallback } from 'react'

type RevalidateNotificationState = () => Promise<void>

export function useNotificationActions(
  revalidateNotificationState: RevalidateNotificationState,
) {
  const requestMutation = useCallback(
    async (url: string, method: string, errorMessage: string) => {
      const response = await fetch(url, { method, credentials: 'include' })

      if (!response.ok) {
        throw new Error(errorMessage)
      }

      await revalidateNotificationState()
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
