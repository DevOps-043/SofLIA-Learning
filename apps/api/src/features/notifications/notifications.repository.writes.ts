import { DatabaseError } from '@/core/errors/app-error'

import type { NotificationDbClient } from './notifications.repository.contract'
import type {
  Notification,
  NotificationInsertPayload,
  NotificationPatch,
} from './notifications.types'

export async function createNotification(
  client: NotificationDbClient,
  payload: NotificationInsertPayload,
) {
  const { data, error } = await client
    .from('user_notifications')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    throw new DatabaseError('Error al crear notificacion', error)
  }

  return data as Notification
}

export async function updateForUser(
  client: NotificationDbClient,
  notificationId: string,
  userId: string,
  patch: NotificationPatch,
) {
  const { data, error } = await client
    .from('user_notifications')
    .update(patch)
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !data) {
    throw new DatabaseError('Error al actualizar la notificacion', error)
  }

  return data as Notification
}

export async function deleteForUser(
  client: NotificationDbClient,
  notificationId: string,
  userId: string,
) {
  const { error } = await client
    .from('user_notifications')
    .delete()
    .eq('notification_id', notificationId)
    .eq('user_id', userId)

  if (error) {
    throw new DatabaseError('Error al eliminar la notificacion', error)
  }
}
