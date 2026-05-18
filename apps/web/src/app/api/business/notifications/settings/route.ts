import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { getAllowedNotificationChannels } from '@/lib/subscription/subscriptionFeatures'
import { getOrganizationPlan } from '@/lib/subscription/subscriptionHelper'

/**
 * GET /api/business/notifications/settings
 * Obtiene la configuración de notificaciones automáticas de la organización
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Tipos de eventos disponibles
    const eventTypes = [
      'course_assigned',
      'course_completed',
      'user_added',
      'progress_milestone',
      'certificate_generated',
      'deadline_approaching'
    ]

    // Obtener configuraciones existentes
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select(SELECT_COLUMNS.notification_settings)
      .eq('organization_id', auth.organizationId)

    if (settingsError && settingsError.code !== 'PGRST116') {
      logger.error('Error fetching notification settings:', settingsError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener configuración de notificaciones'
      }, { status: 500 })
    }

    // Crear configuraciones por defecto si no existen
    const existingSettings = settings || []
    const existingEventTypes = existingSettings.map(s => s.event_type)

    const defaultSettings = eventTypes
      .filter(et => !existingEventTypes.includes(et))
      .map(eventType => ({
        organization_id: auth.organizationId,
        event_type: eventType,
        enabled: true,
        channels: ['email'],
        template: null
      }))

    if (defaultSettings.length > 0) {
      const { error: insertError } = await supabase
        .from('notification_settings')
        .insert(defaultSettings)

      if (insertError) {
        logger.error('Error creating default notification settings:', insertError)
      }
    }

    // Obtener todas las configuraciones (existentes + nuevas)
    const { data: allSettings, error: fetchError } = await supabase
      .from('notification_settings')
      .select(SELECT_COLUMNS.notification_settings)
      .eq('organization_id', auth.organizationId)
      .order('event_type', { ascending: true })

    if (fetchError) {
      logger.error('Error fetching all notification settings:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener configuración de notificaciones'
      }, { status: 500 })
    }

    // Obtener canales disponibles según el plan
    const plan = await getOrganizationPlan(auth.organizationId)
    const availableChannels = getAllowedNotificationChannels(plan)

    return NextResponse.json({
      success: true,
      settings: allSettings || [],
      available_channels: availableChannels,
      event_types: eventTypes.map(et => ({
        value: et,
        label: getEventTypeLabel(et),
        description: getEventTypeDescription(et)
      }))
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/notifications/settings GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * PUT /api/business/notifications/settings
 * Actualiza la configuración de notificaciones automáticas
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { settings } = body

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({
        success: false,
        error: 'Configuraciones de notificaciones son requeridas'
      }, { status: 400 })
    }

    // Validar canales disponibles según plan
    const plan = await getOrganizationPlan(auth.organizationId)
    const allowedChannels = getAllowedNotificationChannels(plan)

    // Actualizar o insertar cada configuración
    const updates = []
    const inserts = []

    for (const setting of settings) {
      const { event_type, enabled, channels, template } = setting

      if (!event_type) continue

      // Filtrar canales según plan
      const filteredChannels = (channels || ['email']).filter((ch: string) => 
        allowedChannels.includes(ch)
      )

      if (filteredChannels.length === 0) {
        filteredChannels.push('email') // Siempre incluir email
      }

      const settingData = {
        organization_id: auth.organizationId,
        event_type,
        enabled: enabled !== undefined ? enabled : true,
        channels: filteredChannels,
        template: template || null,
        updated_at: new Date().toISOString()
      }

      // Verificar si existe
      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('organization_id', auth.organizationId)
        .eq('event_type', event_type)
        .maybeSingle()

      if (existing) {
        updates.push({
          id: existing.id,
          data: settingData
        })
      } else {
        inserts.push(settingData)
      }
    }

    // Ejecutar actualizaciones
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('notification_settings')
        .update({
          enabled: update.data.enabled,
          channels: update.data.channels,
          template: update.data.template,
          updated_at: update.data.updated_at
        })
        .eq('id', update.id)

      if (updateError) {
        logger.error('Error updating notification setting:', updateError)
      }
    }

    // Ejecutar inserciones
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
      message: 'Configuración de notificaciones actualizada exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/notifications/settings PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// Helper functions
function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'course_assigned': 'Curso Asignado',
    'course_completed': 'Curso Completado',
    'user_added': 'Usuario Agregado',
    'progress_milestone': 'Hito de Progreso',
    'certificate_generated': 'Certificado Generado',
    'deadline_approaching': 'Fecha Límite Próxima'
  }
  return labels[eventType] || eventType
}

function getEventTypeDescription(eventType: string): string {
  const descriptions: Record<string, string> = {
    'course_assigned': 'Notificar cuando se asigna un curso a un usuario',
    'course_completed': 'Notificar cuando un usuario completa un curso',
    'user_added': 'Notificar cuando se agrega un nuevo usuario a la organización',
    'progress_milestone': 'Notificar cuando un usuario alcanza hitos de progreso (25%, 50%, 75%)',
    'certificate_generated': 'Notificar cuando se genera un certificado',
    'deadline_approaching': 'Notificar cuando se acerca la fecha límite de un curso asignado'
  }
  return descriptions[eventType] || ''
}


