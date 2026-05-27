import type { getServerClient } from './auto-notifications-server-client'
import { NotificationService } from './notification.service'
import type { CreateNotificationParams } from './notification.service'

type NotificationServerClient = Awaited<ReturnType<typeof getServerClient>>
export type NotificationMetadata = Record<string, unknown>

interface NotificationActor {
  username: string | null
  display_name: string | null
  first_name: string | null
}

export function resolveNotificationActorName(
  actor: NotificationActor | null | undefined,
  fallback = 'Un usuario',
): string {
  return actor?.display_name || actor?.first_name || actor?.username || fallback
}

export async function fetchNotificationActorName(
  supabase: NotificationServerClient,
  userId: string,
  fallback = 'Un usuario',
): Promise<string> {
  const { data } = await supabase
    .from('users')
    .select('username, display_name, first_name')
    .eq('id', userId)
    .maybeSingle()

  return resolveNotificationActorName(data, fallback)
}

export function truncateNotificationPreview(
  preview: string,
  maxLength = 100,
): string {
  if (preview.length <= maxLength) {
    return preview
  }

  return `${preview.substring(0, maxLength)}...`
}

export async function dispatchNotifications(
  notifications: readonly CreateNotificationParams[],
): Promise<void> {
  for (const notification of notifications) {
    await NotificationService.createNotification(notification)
  }
}

export async function dispatchNotificationsInChunks(
  notifications: readonly CreateNotificationParams[],
  batchSize = 100,
): Promise<void> {
  for (let index = 0; index < notifications.length; index += batchSize) {
    await dispatchNotifications(notifications.slice(index, index + batchSize))
  }
}

export function resolveNotificationOrganizationId(
  metadata?: NotificationMetadata,
): string | undefined {
  const organizationId = metadata?.organizationId ?? metadata?.organization_id
  return typeof organizationId === 'string' && organizationId.trim()
    ? organizationId
    : undefined
}
