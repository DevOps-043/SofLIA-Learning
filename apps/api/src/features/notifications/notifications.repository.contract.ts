import type { getServiceClient } from '@/core/supabase/service-client'

import type {
  NormalizedNotificationFilters,
  Notification,
  NotificationInsertPayload,
  NotificationPatch,
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
  findByIdForUser(notificationId: string, userId: string): Promise<Notification | null>
  updateForUser(
    notificationId: string,
    userId: string,
    patch: NotificationPatch,
  ): Promise<Notification>
  deleteForUser(notificationId: string, userId: string): Promise<void>
  getUnreadCount(userId: string): Promise<UnreadNotificationCounts>
  markAllAsRead(userId: string, nowIso: string): Promise<{ updated: number }>
}

export type NotificationDbClient = ReturnType<typeof getServiceClient>

export type NotificationRpcClient = NotificationDbClient & {
  rpc: (
    name: string,
    args: { p_user_id: string },
  ) => {
    single: () => Promise<{
      data: Record<string, unknown> | null
      error: unknown | null
    }>
  }
}
