import type { Notification } from '../services/notification.service'

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export function sortNotificationsByPriority(
  notifications: Notification[],
): Notification[] {
  return [...notifications].sort((a, b) => {
    const priorityA =
      PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 2
    const priorityB =
      PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 2

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}
