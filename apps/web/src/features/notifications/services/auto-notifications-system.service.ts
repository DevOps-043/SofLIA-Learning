import { NotificationService } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import type { NotificationMetadata } from './auto-notifications.shared'

/**
 * Notificaciones automáticas del sistema (autenticación y perfil).
 */
export class SystemNotificationsService {
  /**
   * Mapeo de nombres de columnas a nombres amigables en español
   */
  private static readonly FIELD_DISPLAY_NAMES: Record<string, string> = {
    username: 'Nombre de usuario',
    email: 'Correo electrónico',
    first_name: 'Nombre',
    last_name: 'Apellido',
    display_name: 'Nombre de visualización',
    phone: 'Teléfono',
    bio: 'Biografía',
    location: 'Ubicación',
    cargo_rol: 'Cargo',
    type_rol: 'Cargo de la empresa',
    profile_picture_url: 'Foto de perfil',
    curriculum_url: 'Currículum',
    linkedin_url: 'LinkedIn',
    github_url: 'GitHub',
    website_url: 'Sitio web',
    country_code: 'País',
    points: 'Puntos'
  }

  /**
   * Obtiene el nombre amigable de un campo
   */
  private static getFieldDisplayName(fieldName: string): string {
    return this.FIELD_DISPLAY_NAMES[fieldName] || fieldName
  }

  /**
   * Crea una notificación del sistema para cambio de contraseña
   */
  static async notifyPasswordChanged(userId: string, metadata?: NotificationMetadata): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_password_changed',
        title: 'Contraseña actualizada',
        message: 'Tu contraseña ha sido actualizada exitosamente. Si no fuiste tú, contacta al soporte inmediatamente.',
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_password_changed')
      })
      logger.info('✅ Notificación de cambio de contraseña creada', { userId })
    } catch (error) {
      logger.error('❌ Error creando notificación de cambio de contraseña:', error)
    }
  }

  /**
   * Crea una notificación del sistema para cambio de perfil
   */
  static async notifyProfileUpdated(userId: string, changes: string[], metadata?: NotificationMetadata): Promise<void> {
    try {
      const excludedFields = ['id', 'updated_at', 'created_at', 'last_login_at']
      const displayableChanges = changes.filter(field => !excludedFields.includes(field))

      if (displayableChanges.length === 0) {
        return
      }

      const friendlyNames = displayableChanges.map(field => this.getFieldDisplayName(field))

      let changesText: string
      if (friendlyNames.length === 1) {
        changesText = `Se actualizó: ${friendlyNames[0]}`
      } else if (friendlyNames.length === 2) {
        changesText = `Se actualizaron: ${friendlyNames[0]} y ${friendlyNames[1]}`
      } else {
        const lastField = friendlyNames.pop()
        changesText = `Se actualizaron: ${friendlyNames.join(', ')} y ${lastField}`
      }

      await NotificationService.createNotification({
        userId,
        notificationType: 'system_profile_updated',
        title: 'Perfil actualizado',
        message: changesText,
        metadata: {
          ...metadata,
          changes: displayableChanges,
          friendly_changes: friendlyNames,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_profile_updated')
      })
      logger.info('✅ Notificación de actualización de perfil creada', { userId, changes: displayableChanges })
    } catch (error) {
      logger.error('❌ Error creando notificación de actualización de perfil:', error)
    }
  }

  /**
   * Crea una notificación del sistema para inicio de sesión exitoso
   */
  static async notifyLoginSuccess(userId: string, ip?: string, userAgent?: string, metadata?: NotificationMetadata): Promise<void> {
    try {
      logger.info('🔔 notifyLoginSuccess llamado', { userId, ip })
      const location = ip || 'Ubicación desconocida'

      await NotificationService.createNotification({
        userId,
        notificationType: 'system_login_success',
        title: 'Inicio de sesión exitoso',
        message: `Se inició sesión en tu cuenta desde ${location}. Si no fuiste tú, cambia tu contraseña inmediatamente.`,
        metadata: {
          ...metadata,
          ip,
          userAgent,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_login_success')
      })
      logger.info('✅ Notificación de inicio de sesión creada', { userId, ip })
    } catch (error) {
      logger.error('❌ Error creando notificación de inicio de sesión:', error)
    }
  }

  /**
   * Crea una notificación del sistema para intento de inicio de sesión fallido
   */
  static async notifyLoginFailed(userId: string, ip?: string, userAgent?: string, metadata?: NotificationMetadata): Promise<void> {
    try {
      const location = ip || 'Ubicación desconocida'

      await NotificationService.createNotification({
        userId,
        notificationType: 'system_login_failed',
        title: 'Intento de inicio de sesión fallido',
        message: `Se detectó un intento de inicio de sesión fallido desde ${location}. Si fuiste tú, verifica tus credenciales.`,
        metadata: {
          ...metadata,
          ip,
          userAgent,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_login_failed')
      })
      logger.info('✅ Notificación de inicio de sesión fallido creada', { userId, ip })
    } catch (error) {
      logger.error('❌ Error creando notificación de inicio de sesión fallido:', error)
    }
  }

  /**
   * Crea una notificación del sistema para verificación de email
   */
  static async notifyEmailVerified(userId: string, metadata?: NotificationMetadata): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_email_verified',
        title: 'Email verificado',
        message: 'Tu dirección de correo electrónico ha sido verificada exitosamente.',
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_email_verified')
      })
      logger.info('✅ Notificación de verificación de email creada', { userId })
    } catch (error) {
      logger.error('❌ Error creando notificación de verificación de email:', error)
    }
  }

  /**
   * Crea una notificación del sistema para alerta de seguridad
   */
  static async notifySecurityAlert(userId: string, message: string, metadata?: NotificationMetadata): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_security_alert',
        title: 'Alerta de seguridad',
        message,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_security_alert')
      })
      logger.info('✅ Notificación de alerta de seguridad creada', { userId })
    } catch (error) {
      logger.error('❌ Error creando notificación de alerta de seguridad:', error)
    }
  }
}
