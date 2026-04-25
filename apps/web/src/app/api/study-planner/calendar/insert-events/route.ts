import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SessionService } from '../../../../../features/auth/services/session.service'
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import {
  buildEventsToInsert,
  type InsertEventsRequest,
} from './insert-events-format.service'

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas')
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

interface CalendarIntegrationRow {
  provider: 'google' | 'microsoft'
  access_token: string
  expires_at: string | null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error interno del servidor'
}

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body: InsertEventsRequest = await request.json()
    const { lessonDistribution, timezone, planName } = body

    if (!lessonDistribution || !Array.isArray(lessonDistribution) || lessonDistribution.length === 0) {
      return NextResponse.json({
        error: 'No hay sesiones para insertar',
      }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: integrations, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (integrationError || !integrations || integrations.length === 0) {
      return NextResponse.json({
        error: 'No hay calendario conectado. Por favor, conecta tu calendario primero.',
        requiresConnection: true,
      }, { status: 400 })
    }

    const integration = integrations[0] as CalendarIntegrationRow
    const accessToken = await resolveAccessToken(user.id, integration)
    if (!accessToken) {
      return NextResponse.json({
        error: 'Token expirado y no se pudo refrescar. Por favor, reconecta tu calendario.',
        requiresReconnection: true,
      }, { status: 401 })
    }

    const calendarId = await resolveCalendarId(user.id, integration.provider, accessToken)
    const eventsToInsert = buildEventsToInsert(lessonDistribution, timezone, planName)
    const results = await insertCalendarEvents({
      eventsToInsert,
      provider: integration.provider,
      accessToken,
      calendarId,
    })
    const insertedCount = results.filter((result) => result.success).length
    const failedCount = results.filter((result) => !result.success).length
    const errors = results
      .filter((result) => !result.success)
      .map((result) => `Evento ${result.index + 1}: ${result.error}`)

    return NextResponse.json({
      success: failedCount === 0,
      insertedCount,
      failedCount,
      totalEvents: eventsToInsert.length,
      errors: errors.length > 0 ? errors : undefined,
      calendarId,
      provider: integration.provider,
      message: failedCount === 0
        ? `¡Listo! ${insertedCount} eventos insertados en tu calendario.`
        : `Se insertaron ${insertedCount} de ${eventsToInsert.length} eventos. ${failedCount} fallaron.`,
    })
  } catch (error: unknown) {
    console.error('[Insert Events] Error general:', error)
    return NextResponse.json({
      error: getErrorMessage(error),
      success: false,
    }, { status: 500 })
  }
}

async function resolveAccessToken(
  userId: string,
  integration: CalendarIntegrationRow,
): Promise<string | null> {
  let accessToken = integration.access_token
  const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null
  const needsRefresh = !tokenExpiry || tokenExpiry <= new Date()

  if (!needsRefresh) {
    return accessToken
  }

  accessToken = await CalendarIntegrationService.refreshTokenIfNeeded(userId) || ''
  return accessToken || null
}

async function resolveCalendarId(
  userId: string,
  provider: 'google' | 'microsoft',
  accessToken: string,
): Promise<string | null> {
  if (provider !== 'google') {
    return null
  }

  const calendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken)
  if (calendarId) {
    await CalendarIntegrationService.saveSecondaryCalendarId(userId, calendarId)
  } else {
    console.warn('[Insert Events] No se pudo crear calendario secundario, usando primario')
  }

  return calendarId
}

async function insertCalendarEvents(params: {
  eventsToInsert: ReturnType<typeof buildEventsToInsert>
  provider: 'google' | 'microsoft'
  accessToken: string
  calendarId: string | null
}): Promise<Array<{ success: boolean; eventId?: string; error?: string; index: number }>> {
  const results: Array<{ success: boolean; eventId?: string; error?: string; index: number }> = []
  const throttleMs = 150

  for (let index = 0; index < params.eventsToInsert.length; index++) {
    const event = params.eventsToInsert[index]

    try {
      const result = params.provider === 'google'
        ? await CalendarIntegrationService.createGoogleEvent(params.accessToken, event, params.calendarId)
        : await CalendarIntegrationService.createMicrosoftEvent(params.accessToken, event)

      results.push(
        result
          ? { success: true, eventId: result.id, index }
          : { success: false, error: 'No se pudo crear el evento', index },
      )

      if (index < params.eventsToInsert.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, throttleMs))
      }
    } catch (error: unknown) {
      console.error(`[Insert Events] Error insertando evento ${index + 1}:`, error)
      results.push({ success: false, error: getErrorMessage(error), index })
    }
  }

  return results
}
