import { NotificationService } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import type { NotificationMetadata } from './auto-notifications.shared'

/**
 * Notificaciones automáticas de organización y gestión B2B.
 */
export class OrganizationNotificationsService {
  /**
   * Notifica a un usuario que ha sido invitado a una organización
   */
  static async notifyUserInvited(
    userId: string, 
    organizationId: string, 
    orgName: string, 
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        organizationId,
        notificationType: 'org_invitation_received',
        title: 'notifications.types.org_invitation_received.title',
        message: 'notifications.types.org_invitation_received.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          orgName,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('org_invitation_received')
      })
      logger.info('✅ Notificación de invitación a org creada', { userId, organizationId })
    } catch (error) {
      logger.error('❌ Error creando notificación de invitación a org:', error)
    }
  }

  /**
   * Notifica a un usuario que su rol ha sido actualizado
   */
  static async notifyRoleUpdated(
    userId: string, 
    organizationId: string, 
    newRole: string, 
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        organizationId,
        notificationType: 'org_role_updated',
        title: 'notifications.types.org_role_updated.title',
        message: 'notifications.types.org_role_updated.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          newRole,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('org_role_updated')
      })
      logger.info('✅ Notificación de actualización de rol creada', { userId, newRole })
    } catch (error) {
      logger.error('❌ Error creando notificación de actualización de rol:', error)
    }
  }

  /**
   * Notifica a un usuario que ha sido asignado a un equipo
   */
  static async notifyTeamAssignment(
    userId: string,
    organizationId: string,
    teamName: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        organizationId,
        notificationType: 'team_assignment',
        title: 'notifications.types.team_assignment.title',
        message: 'notifications.types.team_assignment.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          teamName,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('team_assignment')
      })
      logger.info('✅ Notificación de asignación de equipo creada', { userId, teamName })
    } catch (error) {
      logger.error('❌ Error creando notificación de asignación de equipo:', error)
    }
  }
}
