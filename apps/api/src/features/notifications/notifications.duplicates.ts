import { logger } from '@/core/logging/logger'

import type { NotificationRepository } from './notifications.repository'
import { ConflictError } from './notifications.service.errors'
import type { CreateNotificationInput } from './notifications.types'
import { getDuplicateNotificationWindow } from './notifications.utils'

export async function ensureNoRecentDuplicateNotification(
  repository: NotificationRepository,
  input: CreateNotificationInput,
) {
  const duplicateWindow = getDuplicateNotificationWindow(input.notificationType)

  if (!duplicateWindow) {
    return
  }

  const sinceIso = new Date(Date.now() - duplicateWindow * 60 * 1000).toISOString()
  const duplicateExists = await repository.findRecentDuplicate(
    input.userId,
    input.notificationType,
    sinceIso,
  )

  if (!duplicateExists) {
    return
  }

  logger.info('Notificacion duplicada evitada', {
    notificationType: input.notificationType,
    userId: input.userId,
    windowMinutes: duplicateWindow,
  })
  throw new ConflictError('Notificacion duplicada evitada')
}
