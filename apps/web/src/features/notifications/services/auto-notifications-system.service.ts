import type { NotificationMetadata } from './auto-notifications.shared'
import { createSystemNotification } from './auto-notifications-system-create.service'
import { buildProfileUpdatedNotification } from './auto-notifications-system-profile.service'

export class SystemNotificationsService {
  static async notifyPasswordChanged(userId: string, metadata?: NotificationMetadata): Promise<void> {
    await createSystemNotification({
      userId,
      notificationType: 'system_password_changed',
      metadata,
      logSuccess: '✅ Notificación de cambio de contraseña creada',
      logError: '❌ Error creando notificación de cambio de contraseña:',
    })
  }

  static async notifyProfileUpdated(
    userId: string,
    changes: string[],
    metadata?: NotificationMetadata,
  ): Promise<void> {
    const profileNotification = buildProfileUpdatedNotification(changes)

    if (!profileNotification) {
      return
    }

    await createSystemNotification({
      userId,
      notificationType: 'system_profile_updated',
      title: 'Perfil actualizado',
      message: profileNotification.message,
      metadata: {
        ...metadata,
        changes: profileNotification.displayableChanges,
        friendly_changes: profileNotification.friendlyNames,
      },
      logSuccess: '✅ Notificación de actualización de perfil creada',
      logError: '❌ Error creando notificación de actualización de perfil:',
      logContext: { changes: profileNotification.displayableChanges },
    })
  }

  static async notifyLoginSuccess(
    userId: string,
    ip?: string,
    userAgent?: string,
    metadata?: NotificationMetadata,
  ): Promise<void> {
    await createSystemNotification({
      userId,
      notificationType: 'system_login_success',
      metadata: { ...metadata, location: ip || 'Ubicación desconocida', ip, userAgent },
      logSuccess: '✅ Notificación de inicio de sesión creada',
      logError: '❌ Error creando notificación de inicio de sesión:',
      logContext: { ip },
    })
  }

  static async notifyLoginFailed(
    userId: string,
    ip?: string,
    userAgent?: string,
    metadata?: NotificationMetadata,
  ): Promise<void> {
    await createSystemNotification({
      userId,
      notificationType: 'system_login_failed',
      metadata: { ...metadata, location: ip || 'Ubicación desconocida', ip, userAgent },
      logSuccess: '✅ Notificación de inicio de sesión fallido creada',
      logError: '❌ Error creando notificación de inicio de sesión fallido:',
      logContext: { ip },
    })
  }

  static async notifyEmailVerified(userId: string, metadata?: NotificationMetadata): Promise<void> {
    await createSystemNotification({
      userId,
      notificationType: 'system_email_verified',
      metadata,
      logSuccess: '✅ Notificación de verificación de email creada',
      logError: '❌ Error creando notificación de verificación de email:',
    })
  }

  static async notifySecurityAlert(
    userId: string,
    message: string,
    metadata?: NotificationMetadata,
  ): Promise<void> {
    await createSystemNotification({
      userId,
      notificationType: 'system_security_alert',
      metadata: { ...metadata, message },
      logSuccess: '✅ Notificación de alerta de seguridad creada',
      logError: '❌ Error creando notificación de alerta de seguridad:',
    })
  }
}
