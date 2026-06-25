import { hasFeature } from '@/lib/subscription/subscriptionFeatures'
import { logger } from '../../../../lib/logger'
import type { Json } from '../../../../lib/supabase/types'
import type { getSystemNotificationClient } from '../auto-notifications-server-client'
import {
  EXTERNAL_NOTIFICATION_CHANNELS,
  getDefaultNotificationChannels,
  type ExternalNotificationChannel,
  type NotificationChannel,
} from './catalog'
import type { CreateNotificationParams, Notification } from './types'

type NotificationSystemClient = Awaited<ReturnType<typeof getSystemNotificationClient>>

interface NotificationUserDeliveryProfile {
  country_code: string | null
  phone: string | null
}

interface NotificationPreferenceRow {
  whatsapp_enabled?: boolean | null
}

interface OrganizationNotificationSettingRow {
  channels?: unknown
  enabled?: boolean | null
}

const WHATSAPP_DEFAULT_MAX_ATTEMPTS = 5

function getExternalChannels(
  channels: readonly NotificationChannel[] | undefined,
): ExternalNotificationChannel[] {
  return [...new Set((channels || []).filter((channel): channel is ExternalNotificationChannel =>
    EXTERNAL_NOTIFICATION_CHANNELS.includes(channel as ExternalNotificationChannel),
  ))]
}

function normalizePhone(profile: NotificationUserDeliveryProfile | null) {
  const rawPhone = profile?.phone?.replace(/[^\d+]/g, '') || ''
  if (!rawPhone) return null

  if (rawPhone.startsWith('+')) {
    return rawPhone
  }

  const countryCode = profile?.country_code?.replace(/[^\d]/g, '')
  return countryCode ? `+${countryCode}${rawPhone}` : rawPhone
}

async function getUserDeliveryProfile(
  supabase: NotificationSystemClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from('users')
    .select('country_code, phone')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    logger.warn('Unable to resolve notification delivery profile', {
      error,
      userId,
    })
    return null
  }

  return data as NotificationUserDeliveryProfile | null
}

async function isWhatsappEnabledForUser(
  supabase: NotificationSystemClient,
  userId: string,
  notificationType: string,
) {
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .select('whatsapp_enabled')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .maybeSingle()

  if (error) {
    logger.warn('Unable to resolve user notification preferences', {
      error,
      notificationType,
      userId,
    })
    return false
  }

  return Boolean((data as NotificationPreferenceRow | null)?.whatsapp_enabled)
}

async function isWhatsappAllowedForOrganization(
  supabase: NotificationSystemClient,
  organizationId: string | null | undefined,
  notificationType: string,
) {
  if (!organizationId) {
    return true
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', organizationId)
    .maybeSingle()

  const plan =
    typeof organization?.subscription_plan === 'string'
      ? organization.subscription_plan
      : null

  if (!hasFeature(plan, 'notification_whatsapp')) {
    return false
  }

  const { data: setting, error } = await supabase
    .from('notification_settings')
    .select('enabled, channels')
    .eq('organization_id', organizationId)
    .eq('event_type', notificationType)
    .maybeSingle()

  if (error || !setting) {
    return true
  }

  const organizationSetting = setting as OrganizationNotificationSettingRow
  if (organizationSetting.enabled === false) {
    return false
  }

  return Array.isArray(organizationSetting.channels)
    ? organizationSetting.channels.includes('whatsapp')
    : true
}

function buildDeliveryPayload(
  notification: Notification,
  params: CreateNotificationParams,
) {
  return {
    actionUrl:
      typeof params.metadata?.action_url === 'string'
        ? params.metadata.action_url
        : null,
    dedupKey: params.dedupKey || null,
    isLocalized: Boolean(params.isLocalized || params.metadata?.is_localized),
    message: params.message,
    metadata: params.metadata || {},
    notificationId: notification.notification_id,
    notificationType: params.notificationType,
    priority: notification.priority,
    title: params.title,
  }
}

export async function enqueueNotificationChannelDeliveries(
  supabase: NotificationSystemClient,
  notification: Notification,
  params: CreateNotificationParams,
) {
  const requestedExternalChannels = getExternalChannels(
    params.channels ?? getDefaultNotificationChannels(params.notificationType),
  )

  if (!requestedExternalChannels.includes('whatsapp')) {
    return
  }

  const [profile, userWhatsappEnabled, organizationWhatsappAllowed] =
    await Promise.all([
      getUserDeliveryProfile(supabase, params.userId),
      isWhatsappEnabledForUser(supabase, params.userId, params.notificationType),
      isWhatsappAllowedForOrganization(
        supabase,
        params.organizationId || notification.organization_id,
        params.notificationType,
      ),
    ])

  const destination = normalizePhone(profile)
  if (!destination || !userWhatsappEnabled || !organizationWhatsappAllowed) {
    return
  }

  const deliveryPayload = {
    channel: 'whatsapp' as const,
    destination,
    max_attempts: WHATSAPP_DEFAULT_MAX_ATTEMPTS,
    notification_id: notification.notification_id,
    organization_id: params.organizationId || notification.organization_id,
    payload: buildDeliveryPayload(notification, params) as Json,
    status: 'pending' as const,
    user_id: params.userId,
  }

  const { error } = await supabase
    .from('notification_channel_deliveries')
    .upsert(deliveryPayload, { onConflict: 'notification_id,channel' })

  if (error) {
    logger.warn('Unable to enqueue notification channel delivery', {
      error,
      notificationId: notification.notification_id,
    })
  }
}
