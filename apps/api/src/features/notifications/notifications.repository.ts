import { DatabaseError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import { getServiceClient } from '@/core/supabase/service-client'

import { buildNotificationsActiveFilter } from './notifications.utils'
import type {
  NormalizedNotificationFilters,
  Notification,
  NotificationInsertPayload,
  NotificationPatch,
  NotificationPriority,
  UnreadNotificationCounts,
} from './notifications.types'

export interface NotificationRepository {
  create(payload: NotificationInsertPayload): Promise<Notification>
  findRecentDuplicate(
    userId: string,
    notificationType: string,
    sinceIso: string,
  ): Promise<boolean>
  findForUser(
    userId: string,
    filters: NormalizedNotificationFilters,
  ): Promise<{ notifications: Notification[]; total: number }>
  findByIdForUser(
    notificationId: string,
    userId: string,
  ): Promise<Notification | null>
  updateForUser(
    notificationId: string,
    userId: string,
    patch: NotificationPatch,
  ): Promise<Notification>
  deleteForUser(notificationId: string, userId: string): Promise<void>
  getUnreadCount(userId: string): Promise<UnreadNotificationCounts>
  markAllAsRead(userId: string, nowIso: string): Promise<{ updated: number }>
}

type RpcClient = ReturnType<typeof getServiceClient> & {
  rpc: (
    name: string,
    args: { p_user_id: string },
  ) => {
    single: () => Promise<{ data: Record<string, unknown> | null; error: unknown | null }>
  }
}

export class SupabaseNotificationRepository implements NotificationRepository {
  private readonly client = getServiceClient()

  async create(payload: NotificationInsertPayload) {
    const { data, error } = await this.client
      .from('user_notifications')
      .insert(payload)
      .select('*')
      .single()

    if (error || !data) {
      throw new DatabaseError('Error al crear notificacion', error)
    }

    return data as Notification
  }

  async findRecentDuplicate(
    userId: string,
    notificationType: string,
    sinceIso: string,
  ) {
    const { data, error } = await this.client
      .from('user_notifications')
      .select('notification_id')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .gte('created_at', sinceIso)
      .limit(1)

    if (error) {
      logger.warn('No se pudo validar notificacion duplicada', {
        error,
        notificationType,
        userId,
      })
      return false
    }

    return (data?.length ?? 0) > 0
  }

  async findForUser(userId: string, filters: NormalizedNotificationFilters) {
    const activeFilter = buildNotificationsActiveFilter(new Date().toISOString())

    let query = this.client
      .from('user_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .or(activeFilter)

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.notificationType) {
      query = query.eq('notification_type', filters.notificationType)
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }

    if (filters.orderBy === 'priority') {
      query = query
        .order('priority', { ascending: filters.orderDirection === 'asc' })
        .order('created_at', { ascending: filters.orderDirection === 'asc' })
    } else {
      query = query.order(filters.orderBy, {
        ascending: filters.orderDirection === 'asc',
      })
    }

    const { data, error, count } = await query.range(
      filters.offset,
      filters.offset + filters.limit - 1,
    )

    if (error) {
      throw new DatabaseError('Error al obtener notificaciones', error)
    }

    return {
      notifications: (data ?? []) as Notification[],
      total: count ?? 0,
    }
  }

  async findByIdForUser(notificationId: string, userId: string) {
    const { data, error } = await this.client
      .from('user_notifications')
      .select('*')
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new DatabaseError('Error al consultar la notificacion', error)
    }

    return (data as Notification | null) ?? null
  }

  async updateForUser(
    notificationId: string,
    userId: string,
    patch: NotificationPatch,
  ) {
    const { data, error } = await this.client
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

  async deleteForUser(notificationId: string, userId: string) {
    const { error } = await this.client
      .from('user_notifications')
      .delete()
      .eq('notification_id', notificationId)
      .eq('user_id', userId)

    if (error) {
      throw new DatabaseError('Error al eliminar la notificacion', error)
    }
  }

  async getUnreadCount(userId: string) {
    const rpcClient = this.client as RpcClient

    try {
      const { data, error } = await rpcClient
        .rpc('get_unread_notifications_count', { p_user_id: userId })
        .single()

      if (!error) {
        return {
          total: Number(data?.total) || 0,
          critical: Number(data?.critical) || 0,
          high: Number(data?.high) || 0,
        }
      }

      logger.warn('RPC get_unread_notifications_count no disponible', { error })
    } catch (error) {
      logger.warn('Fallo la RPC get_unread_notifications_count', { error })
    }

    return this.getUnreadCountFallback(userId)
  }

  async markAllAsRead(userId: string, nowIso: string) {
    const rpcClient = this.client as RpcClient

    try {
      const { data, error } = await rpcClient
        .rpc('mark_all_notifications_read', { p_user_id: userId })
        .single()

      if (!error) {
        return { updated: Number(data?.updated_count) || 0 }
      }

      logger.warn('RPC mark_all_notifications_read no disponible', { error })
    } catch (error) {
      logger.warn('Fallo la RPC mark_all_notifications_read', { error })
    }

    return this.markAllAsReadFallback(userId, nowIso)
  }

  private async getUnreadCountFallback(userId: string) {
    const [total, critical, high] = await Promise.all([
      this.countUnreadNotifications(userId),
      this.countUnreadNotifications(userId, 'critical'),
      this.countUnreadNotifications(userId, 'high'),
    ])

    return { total, critical, high }
  }

  private async countUnreadNotifications(
    userId: string,
    priority?: NotificationPriority,
  ) {
    const activeFilter = buildNotificationsActiveFilter(new Date().toISOString())
    let query = this.client
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .or(activeFilter)

    if (priority) {
      query = query.eq('priority', priority)
    }

    const { count, error } = await query

    if (error) {
      throw new DatabaseError('Error al contar notificaciones no leidas', error)
    }

    return count ?? 0
  }

  private async markAllAsReadFallback(userId: string, nowIso: string) {
    const totalToUpdate = await this.countUnreadNotifications(userId)

    if (totalToUpdate === 0) {
      return { updated: 0 }
    }

    const activeFilter = buildNotificationsActiveFilter(nowIso)
    const { error } = await this.client
      .from('user_notifications')
      .update({
        status: 'read',
        read_at: nowIso,
        updated_at: nowIso,
      })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .or(activeFilter)

    if (error) {
      throw new DatabaseError(
        'Error al marcar todas las notificaciones como leidas',
        error,
      )
    }

    return { updated: totalToUpdate }
  }
}
