import { getServiceClient } from '@/core/supabase/service-client'

import { getUnreadCount } from './notifications.repository.counts'
import { markAllAsRead } from './notifications.repository.mark-read'
import {
  findByIdForUser,
  findForUser,
  findRecentDuplicate,
} from './notifications.repository.reads'
import {
  createNotification,
  deleteForUser,
  updateForUser,
} from './notifications.repository.writes'
import type { NotificationRepository } from './notifications.repository.contract'
import type {
  NormalizedNotificationFilters,
  NotificationInsertPayload,
  NotificationPatch,
} from './notifications.types'

export type { NotificationRepository } from './notifications.repository.contract'

export class SupabaseNotificationRepository implements NotificationRepository {
  private readonly client = getServiceClient()

  create(payload: NotificationInsertPayload) {
    return createNotification(this.client, payload)
  }

  findRecentDuplicate(
    userId: string,
    notificationType: string,
    sinceIso: string,
  ) {
    return findRecentDuplicate(this.client, userId, notificationType, sinceIso)
  }

  findForUser(userId: string, filters: NormalizedNotificationFilters) {
    return findForUser(this.client, userId, filters)
  }

  findByIdForUser(notificationId: string, userId: string) {
    return findByIdForUser(this.client, notificationId, userId)
  }

  updateForUser(
    notificationId: string,
    userId: string,
    patch: NotificationPatch,
  ) {
    return updateForUser(this.client, notificationId, userId, patch)
  }

  deleteForUser(notificationId: string, userId: string) {
    return deleteForUser(this.client, notificationId, userId)
  }

  getUnreadCount(userId: string) {
    return getUnreadCount(this.client, userId)
  }

  markAllAsRead(userId: string, nowIso: string) {
    return markAllAsRead(this.client, userId, nowIso)
  }
}
