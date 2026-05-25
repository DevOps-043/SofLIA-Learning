import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { CalendarIntegrationService } from '@/features/study-planner/services/calendar-integration.service'
import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger as techDebtLogger } from '@/lib/utils/logger'

import { deletePlanEventsSchema, type DeletePlanEventsBody } from '../../_schemas'

type MicrosoftCalendarDeleteCapable = typeof CalendarIntegrationService & {
  deleteMicrosoftEvent?: (accessToken: string, eventId: string) => Promise<boolean>
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no esta configurada')
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function handlePost(
  _request: NextRequest,
  body: DeletePlanEventsBody,
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const supabase = createAdminClient()
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('id, external_event_id')
      .eq('plan_id', body.planId)
      .not('external_event_id', 'is', null)

    if (error) {
      techDebtLogger.error('Error obteniendo sesiones:', error)
      return apiError('FETCH_SESSIONS_FAILED', 'Error obteniendo sesiones', 500)
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No hay eventos para eliminar',
      })
    }

    const { accessToken, provider, calendarId } =
      await CalendarIntegrationService.getCalendarIdForUser(user.id)

    if (!accessToken || !provider) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        warning: 'No hay conexion activa con calendario',
      })
    }

    const deletionPromises = sessions.map(async (session) => {
      if (!session.external_event_id) return false

      try {
        if (provider === 'google') {
          return CalendarIntegrationService.deleteGoogleEvent(
            accessToken,
            session.external_event_id,
            calendarId,
          )
        }

        if (provider === 'microsoft') {
          const microsoftCalendarService =
            CalendarIntegrationService as MicrosoftCalendarDeleteCapable
          return microsoftCalendarService.deleteMicrosoftEvent
            ? microsoftCalendarService.deleteMicrosoftEvent(
                accessToken,
                session.external_event_id,
              )
            : false
        }
      } catch (error) {
        techDebtLogger.error(`Error borrando evento ${session.external_event_id}:`, error)
      }

      return false
    })

    const results = await Promise.all(deletionPromises)
    const deletedCount = results.filter(Boolean).length

    return NextResponse.json({ success: true, deletedCount })
  } catch (error: unknown) {
    techDebtLogger.error('Error en delete-plan-events:', error)
    return apiError(
      'DELETE_PLAN_EVENTS_FAILED',
      getErrorMessage(error, 'Error interno'),
      500,
    )
  }
}

export const POST = withZodBody(deletePlanEventsSchema, handlePost)
