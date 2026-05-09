import { NotificationService } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import type { NotificationMetadata } from './auto-notifications.shared'

/**
 * Notificaciones automáticas relacionadas con certificados.
 */
export class CertificateNotificationsService {
  /**
   * Crea una notificación para un usuario cuando se genera su certificado.
   */
  static async notifyCertificateGenerated(
    userId: string,
    courseTitle: string,
    certificateId: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'certificate_generated',
        title: 'notifications.types.certificate_generated.title',
        message: 'notifications.types.certificate_generated.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          courseTitle,
          certificate_id: certificateId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('certificate_generated')
      })
      
      logger.info('✅ Notificación de certificado generado creada', { userId, certificateId })
    } catch (error) {
      logger.error('❌ Error creando notificación de certificado generado:', error)
    }
  }
}
