import {
  createCalendarAdminClient,
  getLatestCalendarIntegration,
} from '../events/calendar-events.db'
import type { CalendarIntegrationRecord } from '../events/calendar-events.types'
import type { StudySessionRecord } from './sync-sessions.types'

type SupabaseAdminClient = ReturnType<typeof createCalendarAdminClient>

export async function getSyncSessionsForUser(
  supabase: SupabaseAdminClient,
  userId: string,
  sessionIds: string[],
) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('id, user_id, title, description, start_time, end_time, plan_id, course_id')
    .in('id', sessionIds)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Error obteniendo sesiones: ${error.message}`)
  }

  return (data || []) as StudySessionRecord[]
}

export async function getSyncCalendarIntegration(
  supabase: SupabaseAdminClient,
  userId: string,
) {
  const integration = await getLatestCalendarIntegration(supabase, userId)

  if (!integration) {
    throw new Error('No hay calendario conectado')
  }

  return integration as CalendarIntegrationRecord
}

export async function getPlanTimezoneForSessions(
  supabase: SupabaseAdminClient,
  userId: string,
  sessions: StudySessionRecord[],
) {
  const planId = sessions[0]?.plan_id
  if (!planId) {
    return 'UTC'
  }

  const { data, error } = await supabase
    .from('study_plans')
    .select('timezone')
    .eq('id', planId)
    .eq('user_id', userId)
    .single()

  if (error || !data?.timezone) {
    return 'UTC'
  }

  return data.timezone
}

export async function persistSecondaryCalendarId(
  supabase: SupabaseAdminClient,
  userId: string,
  calendarId: string,
  currentMetadata?: CalendarIntegrationRecord['metadata'] | null,
) {
  await supabase
    .from('calendar_integrations')
    .update({
      metadata: {
        ...(currentMetadata || {}),
        secondary_calendar_id: calendarId,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google')
}

export async function markSessionAsSynced(
  supabase: SupabaseAdminClient,
  sessionId: string,
  provider: CalendarIntegrationRecord['provider'],
  eventId: string,
) {
  const { error } = await supabase
    .from('study_sessions')
    .update({
      external_event_id: eventId,
      calendar_provider: provider,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Error actualizando sesion sincronizada: ${error.message}`)
  }
}
