import { LearningPathNotificationsService } from '../auto-notifications-learning-paths.service'
import type { NotificationMetadata } from '../auto-notifications.shared'

export const learningPathNotificationFacade = {
  notifyPathAssigned(
    userId: string,
    organizationId: string | null,
    pathId: string,
    pathTitle: string,
    metadata?: NotificationMetadata,
  ) {
    return LearningPathNotificationsService.notifyPathAssigned(
      userId,
      organizationId,
      pathId,
      pathTitle,
      metadata,
    )
  },
}
