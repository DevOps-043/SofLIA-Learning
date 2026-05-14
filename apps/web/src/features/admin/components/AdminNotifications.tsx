'use client'

import { NotificationBell } from '@/core/components/NotificationBell'

type AdminNotificationsProps = {
  className?: string
}

/**
 * Backward-compatible admin entry point.
 *
 * Notification UX is intentionally centralized in the global bell so admin,
 * business, learner, and course headers do not drift into separate fronts.
 */
export function AdminNotifications({ className }: AdminNotificationsProps) {
  return <NotificationBell className={className} />
}
