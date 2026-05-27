import { logger } from '@/lib/logger'
import { getNotificationPriority } from '../utils/notification-categories'
import {
  resolveNotificationOrganizationId,
  type NotificationMetadata,
} from './auto-notifications.shared'
import { NotificationService } from './notification.service'

interface CreateSystemNotificationParams {
  userId: string
  notificationType: string
  title?: string
  message?: string
  metadata?: NotificationMetadata
  isLocalized?: boolean
  logSuccess: string
  logError: string
  logContext?: Record<string, unknown>
  organizationId?: string | null
}

export async function createSystemNotification({
  userId,
  notificationType,
  title,
  message,
  metadata,
  isLocalized,
  logSuccess,
  logError,
  logContext,
  organizationId,
}: CreateSystemNotificationParams): Promise<void> {
  try {
    await NotificationService.createNotification({
      userId,
      notificationType,
      title: title || `notifications.types.${notificationType}.title`,
      message: message || `notifications.types.${notificationType}.message`,
      isLocalized: isLocalized ?? (!title && !message),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      organizationId:
        organizationId || resolveNotificationOrganizationId(metadata),
      priority: getNotificationPriority(notificationType),
    })
    logger.info(logSuccess, { userId, ...logContext })
  } catch (error) {
    logger.error(logError, error)
  }
}
