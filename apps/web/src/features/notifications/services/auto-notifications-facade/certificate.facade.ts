import { CertificateNotificationsService } from '../auto-notifications-certificates.service'
import type { NotificationMetadata } from '../auto-notifications.shared'

export const certificateNotificationFacade = {
  notifyCertificateGenerated(
    userId: string,
    courseTitle: string,
    certificateId: string,
    metadata?: NotificationMetadata,
  ) {
    return CertificateNotificationsService.notifyCertificateGenerated(
      userId,
      courseTitle,
      certificateId,
      metadata,
    )
  },
}
