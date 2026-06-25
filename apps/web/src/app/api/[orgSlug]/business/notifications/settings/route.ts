import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { logger } from '@/lib/utils/logger'
import { getAllowedNotificationChannels } from '@/lib/subscription/subscriptionFeatures'
import { getOrganizationPlan } from '@/lib/subscription/subscriptionHelper'
import {
  BUSINESS_NOTIFICATION_EVENT_TYPES,
  DEFAULT_BUSINESS_NOTIFICATION_CHANNELS,
  buildBusinessNotificationEventOptions,
} from '@/features/notifications/services/notification-settings.catalog'
import {
  notificationSettingsUpdateSchema,
  type NotificationSettingsUpdateBody,
} from '../../_schemas'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

type NotificationSettingData = {
  organization_id: string
  event_type: string
  enabled: boolean
  channels: string[]
  template: unknown
  updated_at: string
}

function filterAllowedChannels(
  requestedChannels: string[] | undefined,
  allowedChannels: string[],
) {
  const filteredChannels = (requestedChannels || [
    ...DEFAULT_BUSINESS_NOTIFICATION_CHANNELS,
  ]).filter((channel) => channel === 'in_app' || allowedChannels.includes(channel))

  return filteredChannels.length > 0 ? filteredChannels : ['in_app']
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError(
        'NO_ORGANIZATION',
        'Usuario no pertenece a ninguna organizacion',
        400,
      )
    }

    const supabase = await createClient()
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select(SELECT_COLUMNS.notification_settings)
      .eq('organization_id', auth.organizationId)

    if (settingsError && settingsError.code !== 'PGRST116') {
      logger.error('Error fetching notification settings:', settingsError)
      return apiError(
        'FETCH_NOTIFICATION_SETTINGS_FAILED',
        'Error al obtener configuracion de notificaciones',
        500,
      )
    }

    const existingEventTypes = (settings || []).map((setting) => setting.event_type)
    const defaultSettings = BUSINESS_NOTIFICATION_EVENT_TYPES
      .filter((eventType) => !existingEventTypes.includes(eventType))
      .map((eventType) => ({
        channels: [...DEFAULT_BUSINESS_NOTIFICATION_CHANNELS],
        enabled: true,
        event_type: eventType,
        organization_id: auth.organizationId,
        template: null,
      }))

    if (defaultSettings.length > 0) {
      const { error: insertError } = await supabase
        .from('notification_settings')
        .insert(defaultSettings)

      if (insertError) {
        logger.error('Error creating default notification settings:', insertError)
      }
    }

    const { data: allSettings, error: fetchError } = await supabase
      .from('notification_settings')
      .select(SELECT_COLUMNS.notification_settings)
      .eq('organization_id', auth.organizationId)
      .order('event_type', { ascending: true })

    if (fetchError) {
      logger.error('Error fetching all notification settings:', fetchError)
      return apiError(
        'FETCH_NOTIFICATION_SETTINGS_FAILED',
        'Error al obtener configuracion de notificaciones',
        500,
      )
    }

    const plan = await getOrganizationPlan(auth.organizationId)
    const availableChannels = [
      'in_app',
      ...getAllowedNotificationChannels(plan),
    ]

    return NextResponse.json({
      success: true,
      settings: allSettings || [],
      available_channels: [...new Set(availableChannels)],
      event_types: buildBusinessNotificationEventOptions(),
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/notifications/settings GET:', error)
    return apiError(
      'FETCH_NOTIFICATION_SETTINGS_FAILED',
      'Error interno del servidor',
      500,
    )
  }
}

async function handlePut(
  _request: NextRequest,
  body: NotificationSettingsUpdateBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError(
        'NO_ORGANIZATION',
        'Usuario no pertenece a ninguna organizacion',
        400,
      )
    }

    const supabase = await createClient()
    const plan = await getOrganizationPlan(auth.organizationId)
    const allowedChannels = getAllowedNotificationChannels(plan)
    const updates: Array<{ id: string; data: NotificationSettingData }> = []
    const inserts: NotificationSettingData[] = []

    for (const setting of body.settings) {
      const { event_type, enabled, channels, template } = setting
      if (!event_type) continue

      const settingData: NotificationSettingData = {
        channels: filterAllowedChannels(channels, allowedChannels),
        enabled: enabled !== undefined ? enabled : true,
        event_type,
        organization_id: auth.organizationId,
        template: template || null,
        updated_at: new Date().toISOString(),
      }

      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('organization_id', auth.organizationId)
        .eq('event_type', event_type)
        .maybeSingle()

      if (existing) {
        updates.push({ id: existing.id, data: settingData })
      } else {
        inserts.push(settingData)
      }
    }

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('notification_settings')
        .update({
          channels: update.data.channels,
          enabled: update.data.enabled,
          template: update.data.template,
          updated_at: update.data.updated_at,
        })
        .eq('id', update.id)

      if (updateError) {
        logger.error('Error updating notification setting:', updateError)
      }
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('notification_settings')
        .insert(inserts)

      if (insertError) {
        logger.error('Error inserting notification settings:', insertError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configuracion de notificaciones actualizada exitosamente',
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/notifications/settings PUT:', error)
    return apiError(
      'UPDATE_NOTIFICATION_SETTINGS_FAILED',
      'Error interno del servidor',
      500,
    )
  }
}

export const PUT = withZodBody(notificationSettingsUpdateSchema, handlePut)
