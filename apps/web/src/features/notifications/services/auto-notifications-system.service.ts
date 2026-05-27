import type { NotificationMetadata } from './auto-notifications.shared'
import { createSystemNotification } from './auto-notifications-system-create.service'
import { buildProfileUpdatedNotification } from './auto-notifications-system-profile.service'

function resolveLoginClient(userAgent?: string) {
  const normalized = (userAgent || '').toLowerCase()
  const browser = normalized.includes('edg/')
    ? 'Microsoft Edge'
    : normalized.includes('chrome/')
      ? 'Chrome'
      : normalized.includes('firefox/')
        ? 'Firefox'
        : normalized.includes('safari/')
          ? 'Safari'
          : 'Navegador desconocido'

  const operatingSystem = normalized.includes('windows')
    ? 'Windows'
    : normalized.includes('mac os')
      ? 'macOS'
      : normalized.includes('android')
        ? 'Android'
        : normalized.includes('iphone') || normalized.includes('ipad')
          ? 'iOS'
          : normalized.includes('linux')
            ? 'Linux'
            : 'Sistema desconocido'

  const deviceType = normalized.includes('mobile')
    ? 'mobile'
    : normalized.includes('tablet') || normalized.includes('ipad')
      ? 'tablet'
      : 'desktop'

  return {
    browser,
    deviceLabel: `${browser} (${operatingSystem})`,
    deviceType,
    operatingSystem,
  }
}

function resolveIpLabel(ip?: string) {
  return ip && ip !== 'unknown' ? ip : 'IP no disponible'
}

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
    organizationId?: string | null,
  ): Promise<void> {
    const profileNotification = buildProfileUpdatedNotification(changes)

    if (!profileNotification) {
      return
    }

    await createSystemNotification({
      userId,
      notificationType: 'system_profile_updated',
      title: 'notifications.types.system_profile_updated.title',
      message: 'notifications.types.system_profile_updated.message',
      isLocalized: true,
      metadata: {
        ...metadata,
        action_url: '/profile',
        changes: profileNotification.displayableChanges,
        changesCount: profileNotification.displayableChanges.length,
        changesText: profileNotification.friendlyNames.join(', '),
        friendly_changes: profileNotification.friendlyNames,
      },
      organizationId,
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
    const client = resolveLoginClient(userAgent)
    const ipLabel = resolveIpLabel(ip)

    await createSystemNotification({
      userId,
      notificationType: 'system_login_success',
      metadata: {
        ...metadata,
        action_url: '/profile?tab=security',
        auth_method: metadata?.isOAuth ? 'oauth' : 'password',
        browser: client.browser,
        deviceLabel: client.deviceLabel,
        deviceType: client.deviceType,
        ip,
        ipLabel,
        location: ipLabel,
        operatingSystem: client.operatingSystem,
        rememberMe: metadata?.rememberMe ?? false,
        sessionMode: metadata?.rememberMe ? 'extendida' : 'normal',
        userAgent,
      },
      logSuccess: '✅ Notificación de inicio de sesión creada',
      logError: '❌ Error creando notificación de inicio de sesión:',
      logContext: { device: client.deviceLabel, ip },
    })
  }

  static async notifyLoginFailed(
    userId: string,
    ip?: string,
    userAgent?: string,
    metadata?: NotificationMetadata,
  ): Promise<void> {
    const client = resolveLoginClient(userAgent)
    const ipLabel = resolveIpLabel(ip)

    await createSystemNotification({
      userId,
      notificationType: 'system_login_failed',
      metadata: {
        ...metadata,
        browser: client.browser,
        deviceLabel: client.deviceLabel,
        ip,
        ipLabel,
        location: ipLabel,
        operatingSystem: client.operatingSystem,
        userAgent,
      },
      logSuccess: '✅ Notificación de inicio de sesión fallido creada',
      logError: '❌ Error creando notificación de inicio de sesión fallido:',
      logContext: { device: client.deviceLabel, ip },
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
