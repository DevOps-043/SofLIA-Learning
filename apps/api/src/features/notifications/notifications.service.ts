import { NotFoundError } from '@/core/errors/app-error'

import {
  SupabaseNotificationRepository,
  type NotificationRepository,
} from './notifications.repository'
import { ensureNoRecentDuplicateNotification } from './notifications.duplicates'
import {
  buildNotificationInsertPayload,
  normalizeNotificationFilters,
} from './notifications.utils'
import type {
  CreateNotificationInput,
  NotificationFilters,
  UnreadNotificationCounts,
} from './notifications.types'

export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository = new SupabaseNotificationRepository(),
  ) {}

  async createNotification(input: CreateNotificationInput) {
    await ensureNoRecentDuplicateNotification(this.repository, input)
    return this.repository.create(buildNotificationInsertPayload(input))
  }

  async getUserNotifications(userId: string, filters?: NotificationFilters) {
    const normalizedFilters = normalizeNotificationFilters(filters)
    const { notifications, total } = await this.repository.findForUser(
      userId,
      normalizedFilters,
    )

    return {
      notifications,
      total,
      limit: normalizedFilters.limit,
      offset: normalizedFilters.offset,
      hasMore: normalizedFilters.offset + normalizedFilters.limit < total,
    }
  }

  async getUnreadCount(userId: string): Promise<UnreadNotificationCounts> {
    return this.repository.getUnreadCount(userId)
  }

  async markAsRead(notificationId: string, userId: string) {
    const existingNotification = await this.requireOwnedNotification(
      notificationId,
      userId,
    )

    if (existingNotification.status === 'read') {
      return existingNotification
    }

    const nowIso = new Date().toISOString()

    return this.repository.updateForUser(notificationId, userId, {
      status: 'read',
      read_at: nowIso,
      updated_at: nowIso,
    })
  }

  async archiveNotification(notificationId: string, userId: string) {
    await this.requireOwnedNotification(notificationId, userId)

    return this.repository.updateForUser(notificationId, userId, {
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
  }

  async deleteNotification(notificationId: string, userId: string) {
    await this.requireOwnedNotification(notificationId, userId)
    await this.repository.deleteForUser(notificationId, userId)
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId, new Date().toISOString())
  }

  private async requireOwnedNotification(notificationId: string, userId: string) {
    const notification = await this.repository.findByIdForUser(notificationId, userId)

    if (!notification) {
      throw new NotFoundError(
        'Notificacion no encontrada o no pertenece al usuario',
        'NOTIFICATION_NOT_FOUND',
      )
    }

    return notification
  }
}
