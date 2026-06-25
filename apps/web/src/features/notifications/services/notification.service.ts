import {
  archiveNotification,
  createNotification,
  deleteNotification,
  getRecentActivity,
  getUnreadCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markMultipleNotificationsAsRead,
  markNotificationAsRead,
} from './notification'
import type { getServerClient } from './auto-notifications-server-client'
import type {
  CreateNotificationParams,
  Notification,
  NotificationDeleteMutationResult,
  NotificationFilters,
  NotificationQueryResult,
  NotificationStatusMutationResult,
} from './notification'

export type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
}

type NotificationSupabaseClient = Awaited<ReturnType<typeof getServerClient>>

export class NotificationService {
  static async createNotification(
    params: CreateNotificationParams,
  ): Promise<Notification> {
    return createNotification(params)
  }

  static async getUserNotifications(
    userId: string,
    filters?: NotificationFilters,
    supabase?: NotificationSupabaseClient,
  ): Promise<NotificationQueryResult> {
    if (!supabase) {
      return getUserNotifications(userId, filters)
    }

    return getUserNotifications(userId, filters, { supabase })
  }

  static async getUnreadCount(userId: string, supabase?: NotificationSupabaseClient): Promise<{
    total: number
    critical: number
    high: number
  }> {
    if (!supabase) {
      return getUnreadCount(userId)
    }

    return getUnreadCount(userId, { supabase })
  }

  static async markAsRead(
    notificationId: string,
    userId: string,
    supabase?: NotificationSupabaseClient,
  ): Promise<NotificationStatusMutationResult> {
    if (!supabase) {
      return markNotificationAsRead(notificationId, userId)
    }

    return markNotificationAsRead(notificationId, userId, { supabase })
  }

  static async markMultipleAsRead(
    notificationIds: string[],
    userId: string,
    supabase?: NotificationSupabaseClient,
  ): Promise<{ updated: number }> {
    if (!supabase) {
      return markMultipleNotificationsAsRead(notificationIds, userId)
    }

    return markMultipleNotificationsAsRead(notificationIds, userId, { supabase })
  }

  static async archiveNotification(
    notificationId: string,
    userId: string,
    supabase?: NotificationSupabaseClient,
  ): Promise<NotificationStatusMutationResult> {
    if (!supabase) {
      return archiveNotification(notificationId, userId)
    }

    return archiveNotification(notificationId, userId, { supabase })
  }

  static async deleteNotification(
    notificationId: string,
    userId: string,
    supabase?: NotificationSupabaseClient,
  ): Promise<NotificationDeleteMutationResult> {
    if (!supabase) {
      return deleteNotification(notificationId, userId)
    }

    return deleteNotification(notificationId, userId, { supabase })
  }

  static async markAllAsRead(
    userId: string,
    supabase?: NotificationSupabaseClient,
  ): Promise<{ updated: number }> {
    if (!supabase) {
      return markAllNotificationsAsRead(userId)
    }

    return markAllNotificationsAsRead(userId, { supabase })
  }

  static async getRecentActivity(
    limit = 10,
    supabase?: NotificationSupabaseClient,
  ): Promise<Array<Record<string, unknown>>> {
    if (!supabase) {
      return getRecentActivity(limit)
    }

    return getRecentActivity(limit, { supabase })
  }
}
