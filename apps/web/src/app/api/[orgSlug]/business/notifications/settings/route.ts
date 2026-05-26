import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { getAllowedNotificationChannels } from '@/lib/subscription/subscriptionFeatures'
import { getOrganizationPlan } from '@/lib/subscription/subscriptionHelper'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
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

/**
 * GET /api/[orgSlug]/business/notifications/settings
 * Obtiene la configuracion de notificaciones automaticas de la organizacion
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organizacion',
      }, { status: 400 })
    }

    const supabase = await createClient()
    const eventTypes = [
      'course_assigned',
      'course_completed',
      'user_added',
      'progress_milestone',
      'certificate_generated',
      'deadline_approaching',
    ]

    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select(SELECT_COLUMNS.notification_settings)
      .eq('organization_id', auth.organizationId)

    if (settingsError && settingsError.code !== 'PGRST116') {
      logger.error('Error fetching notification settings:', settingsError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener configuracion de notificaciones',
      }, { status: 500 })
    }

    const existingSettings = settings || []
    const existingEventTypes = existingSettings.map((setting) => setting.event_type)

    const defaultSettings = eventTypes
      .filter((eventType) => !existingEventTypes.includes(eventType))
      .map((eventType) => ({
        organization_id: auth.organizationId,
        event_type: eventType,
        enabled: true,
        channels: ['email'],
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
      return NextResponse.json({
        success: false,
        error: 'Error al obtener configuracion de notificaciones',
      }, { status: 500 })
    }

    const plan = await getOrganizationPlan(auth.organizationId)
    const availableChannels = getAllowedNotificationChannels(plan)

    return NextResponse.json({
      success: true,
      settings: allSettings || [],
      available_channels: availableChannels,
      event_types: eventTypes.map((eventType) => ({
        value: eventType,
        label: getEventTypeLabel(eventType),
        description: getEventTypeDescription(eventType),
      })),
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/notifications/settings GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}

/**
 * PUT /api/[orgSlug]/business/notifications/settings
 * Actualiza la configuracion de notificaciones automaticas
 */
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
    const { settings } = body
    const plan = await getOrganizationPlan(auth.organizationId)
    const allowedChannels = getAllowedNotificationChannels(plan)

    const updates: Array<{ id: string; data: NotificationSettingData }> = []
    const inserts: NotificationSettingData[] = []

    for (const setting of settings) {
      const { event_type, enabled, channels, template } = setting

      if (!event_type) continue

      const filteredChannels = (channels || ['email']).filter((channel) =>
        allowedChannels.includes(channel),
      )

      if (filteredChannels.length === 0) {
        filteredChannels.push('email')
      }

      const settingData: NotificationSettingData = {
        organization_id: auth.organizationId,
        event_type,
        enabled: enabled !== undefined ? enabled : true,
        channels: filteredChannels,
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
        updates.push({
          id: existing.id,
          data: settingData,
        })
      } else {
        inserts.push(settingData)
      }
    }

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('notification_settings')
        .update({
          enabled: update.data.enabled,
          channels: update.data.channels,
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
    return apiError('UPDATE_NOTIFICATION_SETTINGS_FAILED', 'Error interno del servidor', 500)
  }
}

export const PUT = withZodBody(notificationSettingsUpdateSchema, handlePut)

function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    course_assigned: 'Curso Asignado',
    course_completed: 'Curso Completado',
    user_added: 'Usuario Agregado',
    progress_milestone: 'Hito de Progreso',
    certificate_generated: 'Certificado Generado',
    deadline_approaching: 'Fecha Limite Proxima',
  }
  return labels[eventType] || eventType
}

function getEventTypeDescription(eventType: string): string {
  const descriptions: Record<string, string> = {
    course_assigned: 'Notificar cuando se asigna un curso a un usuario',
    course_completed: 'Notificar cuando un usuario completa un curso',
    user_added: 'Notificar cuando se agrega un nuevo usuario a la organizacion',
    progress_milestone: 'Notificar cuando un usuario alcanza hitos de progreso (25%, 50%, 75%)',
    certificate_generated: 'Notificar cuando se genera un certificado',
    deadline_approaching: 'Notificar cuando se acerca la fecha limite de un curso asignado',
  }
  return descriptions[eventType] || ''
}
