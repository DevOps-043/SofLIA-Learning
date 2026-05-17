import { AutoNotificationsService } from '@/features/notifications/services/auto-notifications.service'
import { logger } from '@/lib/utils/logger'

export async function notifyUserPathAssigned(
  userId: string,
  organizationId: string,
  learningPathId: string,
  pathTitle: string,
) {
  try {
    await AutoNotificationsService.notifyPathAssigned(
      userId,
      organizationId,
      learningPathId,
      pathTitle,
    )
  } catch (notificationError) {
    logger.error('Error enviando notificacion de ruta asignada:', notificationError)
  }
}
