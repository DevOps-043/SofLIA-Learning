import { logger } from '@/lib/logger'
import { getNotificationPriority } from '../utils/notification-categories'
import type { NotificationMetadata } from './auto-notifications.shared'
import { NotificationService } from './notification.service'

interface CreateSystemNotificationParams {
  userId: string
  notificationType: string
  title?: string
  message?: string
  metadata?: NotificationMetadata
  logSuccess: string
  logError: string
  logContext?: Record<string, unknown>
}

export async function createSystemNotification({
  userId,
  notificationType,
  title,
  message,
  metadata,
  logSuccess,
  logError,
  logContext,
}: CreateSystemNotificationParams): Promise<void> {
  try {
    await NotificationService.createNotification({
      userId,
      notificationType,
      title: title || `notifications.types.${notificationType}.title`,
      message: message || `notifications.types.${notificationType}.message`,
      isLocalized: !title && !message,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      priority: getNotificationPriority(notificationType),
    })
    logger.info(logSuccess, { userId, ...logContext })
  } catch (error) {
    logger.error(logError, error)
  }
}
