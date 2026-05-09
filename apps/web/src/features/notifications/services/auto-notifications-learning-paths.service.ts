import { NotificationService } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import type { NotificationMetadata } from './auto-notifications.shared'

/**
 * Notificaciones automáticas de Learning Paths (B2B).
 */
export class LearningPathNotificationsService {
  /**
   * Notifica a un usuario que se le ha asignado un Learning Path
   */
  static async notifyPathAssigned(
    userId: string,
    organizationId: string | null,
    pathId: string,
    pathTitle: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        organizationId: organizationId || undefined,
        notificationType: 'learning_path_assigned',
        title: 'notifications.types.learning_path_assigned.title',
        message: 'notifications.types.learning_path_assigned.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          pathId,
          title: pathTitle,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('learning_path_assigned')
      })
      logger.info('✅ Notificación de asignación de path creada', { userId, pathId })
    } catch (error) {
      logger.error('❌ Error creando notificación de asignación de path:', error)
    }
  }
}
