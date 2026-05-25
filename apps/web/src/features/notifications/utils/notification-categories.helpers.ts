import type { LucideIcon } from 'lucide-react'
import { NOTIFICATION_CATEGORIES } from './notification-categories.config'
import { NOTIFICATION_TYPE_ICONS } from './notification-categories.icons'
import { NOTIFICATION_TYPE_CATEGORY_MAP } from './notification-categories.map'
import type {
  NotificationCategoryConfig,
  NotificationPriority,
} from './notification-categories.types'

export function getNotificationCategoryConfig(
  notificationType: string,
): NotificationCategoryConfig {
  const category = NOTIFICATION_TYPE_CATEGORY_MAP[notificationType] || 'system'
  return NOTIFICATION_CATEGORIES[category]
}

export function getNotificationIcon(notificationType: string): LucideIcon {
  return (
    NOTIFICATION_TYPE_ICONS[notificationType] ||
    NOTIFICATION_CATEGORIES.system.icon
  )
}

export function getNotificationBorderColor(notificationType: string): string {
  return getNotificationCategoryConfig(notificationType).borderColor
}

export function getNotificationBgColor(notificationType: string): string {
  return getNotificationCategoryConfig(notificationType).bgColor
}

export function getNotificationTextColor(notificationType: string): string {
  return getNotificationCategoryConfig(notificationType).color
}

export function getNotificationPriority(
  notificationType: string,
): NotificationPriority {
  return getNotificationCategoryConfig(notificationType).priority
}
