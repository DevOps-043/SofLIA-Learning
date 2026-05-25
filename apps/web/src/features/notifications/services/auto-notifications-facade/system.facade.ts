import { SystemNotificationsService } from '../auto-notifications-system.service'
import type { NotificationMetadata } from '../auto-notifications.shared'

export const systemNotificationFacade = {
  notifyPasswordChanged(userId: string, metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifyPasswordChanged(userId, metadata)
  },
  notifyProfileUpdated(userId: string, changes: string[], metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifyProfileUpdated(userId, changes, metadata)
  },
  notifyLoginSuccess(
    userId: string,
    ip?: string,
    userAgent?: string,
    metadata?: NotificationMetadata,
  ) {
    return SystemNotificationsService.notifyLoginSuccess(userId, ip, userAgent, metadata)
  },
  notifyLoginFailed(
    userId: string,
    ip?: string,
    userAgent?: string,
    metadata?: NotificationMetadata,
  ) {
    return SystemNotificationsService.notifyLoginFailed(userId, ip, userAgent, metadata)
  },
  notifyEmailVerified(userId: string, metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifyEmailVerified(userId, metadata)
  },
  notifySecurityAlert(userId: string, message: string, metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifySecurityAlert(userId, message, metadata)
  },
}
