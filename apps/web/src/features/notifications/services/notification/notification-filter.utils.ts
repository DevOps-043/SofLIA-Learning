import type { NotificationFilters } from './types'

export function normalizeNotificationFilters(filters?: NotificationFilters) {
  return {
    status: filters?.status,
    notificationType: filters?.notificationType,
    priority: filters?.priority,
    limit:
      filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 50,
    offset: filters?.offset && filters.offset >= 0 ? filters.offset : 0,
    cursor: filters?.cursor?.trim() || undefined,
    orderBy: filters?.orderBy || 'created_at',
    orderDirection: filters?.orderDirection || 'desc',
  }
}

export function shouldUseNotificationCursorPagination(filters: {
  cursor?: string
  offset: number
  orderBy: 'created_at' | 'priority' | 'status'
}) {
  return filters.orderBy === 'created_at' && (Boolean(filters.cursor) || filters.offset === 0)
}

export function buildNotificationsActiveFilter(now: string) {
  return `expires_at.is.null,expires_at.gt.${now}`
}
