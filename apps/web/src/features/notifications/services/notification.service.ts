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
import type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
  NotificationQueryResult,
} from './notification'

export type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
}

export class NotificationService {
  static async createNotification(
    params: CreateNotificationParams,
  ): Promise<Notification> {
    return createNotification(params)
  }

  static async getUserNotifications(
    userId: string,
    filters?: NotificationFilters,
  ): Promise<NotificationQueryResult> {
    return getUserNotifications(userId, filters)
  }

  static async getUnreadCount(userId: string): Promise<{
    total: number
    critical: number
    high: number
  }> {
    return getUnreadCount(userId)
  }

  static async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    return markNotificationAsRead(notificationId, userId)
  }

  static async markMultipleAsRead(
    notificationIds: string[],
    userId: string,
  ): Promise<{ updated: number }> {
    return markMultipleNotificationsAsRead(notificationIds, userId)
  }

  static async archiveNotification(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    return archiveNotification(notificationId, userId)
  }

  static async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    return deleteNotification(notificationId, userId)
  }

  static async markAllAsRead(userId: string): Promise<{ updated: number }> {
    return markAllNotificationsAsRead(userId)
  }

  static async getRecentActivity(
    limit = 10,
  ): Promise<Array<Record<string, unknown>>> {
    return getRecentActivity(limit)
  }
}
