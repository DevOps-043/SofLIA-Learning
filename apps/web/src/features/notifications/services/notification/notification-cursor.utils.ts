import type {
  Notification,
  NotificationCursor,
} from './types'

export function encodeNotificationCursor(
  notification: Pick<Notification, 'created_at' | 'notification_id'>,
) {
  return `${notification.created_at}::${notification.notification_id}`
}

export function parseNotificationCursor(
  cursor?: string,
): NotificationCursor | null {
  if (!cursor) {
    return null
  }

  const [createdAt, notificationId] = cursor.split('::')
  if (!createdAt || !notificationId) {
    return null
  }

  const parsedDate = new Date(createdAt)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return {
    createdAt,
    notificationId,
  }
}

export function buildNextNotificationCursor(
  notifications: Array<Pick<Notification, 'created_at' | 'notification_id'>>,
) {
  const lastNotification = notifications[notifications.length - 1]

  if (!lastNotification) {
    return null
  }

  return encodeNotificationCursor(lastNotification)
}
