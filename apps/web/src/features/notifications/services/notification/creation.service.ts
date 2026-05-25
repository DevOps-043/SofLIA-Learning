import { logger } from '../../../../lib/logger'
import { getSystemNotificationClient } from '../auto-notifications-server-client'
import {
  buildNotificationInsertPayload,
  getDuplicateNotificationWindow,
} from './utils'
import type { CreateNotificationParams, Notification } from './types'

async function checkDuplicateNotification(
  userId: string,
  notificationType: string,
  minutesWindow: number,
) {
  try {
    const supabase = await getSystemNotificationClient()
    const windowStart = new Date(Date.now() - minutesWindow * 60 * 1000)

    const { data, error } = await supabase
      .from('user_notifications')
      .select('notification_id')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .gte('created_at', windowStart.toISOString())
      .limit(1)

    if (error) {
      logger.warn('Error verificando duplicados', { error })
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    logger.warn('Error en checkDuplicateNotification', { error })
    return false
  }
}

export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification> {
  if (!params.userId || !params.notificationType || !params.title || !params.message) {
    throw new Error('Faltan campos requeridos para crear la notificacion')
  }

  const supabase = await getSystemNotificationClient()

  const duplicateWindow = getDuplicateNotificationWindow(params.notificationType)
  if (duplicateWindow) {
    const isDuplicate = await checkDuplicateNotification(
      params.userId,
      params.notificationType,
      duplicateWindow,
    )

    if (isDuplicate) {
      logger.info('Notificacion duplicada evitada', {
        userId: params.userId,
        notificationType: params.notificationType,
        window: `${duplicateWindow} minutos`,
      })
      throw new Error('Notificacion duplicada evitada')
    }
  }

  const { data, error } = await supabase
    .from('user_notifications')
    .insert(buildNotificationInsertPayload(params))
    .select()
    .single()

  if (error) {
    logger.error('Error creando notificacion:', error)
    throw new Error(`Error al crear notificacion: ${error.message}`)
  }

  logger.info('Notificacion creada exitosamente', {
    notificationId: data.notification_id,
    userId: params.userId,
    type: params.notificationType,
  })

  return data as Notification
}
