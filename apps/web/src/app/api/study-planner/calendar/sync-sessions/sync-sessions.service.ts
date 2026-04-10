import { CalendarIntegrationService } from '@/features/study-planner/services/calendar-integration.service'
import { refreshCalendarAccessToken } from '../events/calendar-events-oauth.service'
import { needsCalendarTokenRefresh } from '../events/calendar-events.utils'
import {
  getPlanTimezoneForSessions,
  markSessionAsSynced,
  persistSecondaryCalendarId,
} from './sync-sessions.db'
import {
  createGoogleStudySessionEvent,
  createMicrosoftStudySessionEvent,
} from './sync-sessions-provider.service'
import type {
  PreparedSyncSessionsContext,
  StudySessionRecord,
} from './sync-sessions.types'

type SupabaseAdminClient = Parameters<typeof refreshCalendarAccessToken>[0]
type CalendarIntegrationRecord = Parameters<
  typeof refreshCalendarAccessToken
>[1]

interface PrepareSyncSessionsContextParams {
  supabase: SupabaseAdminClient
  userId: string
  sessions: StudySessionRecord[]
  integration: CalendarIntegrationRecord
}

export async function prepareSyncSessionsContext({
  supabase,
  userId,
  sessions,
  integration,
}: PrepareSyncSessionsContextParams): Promise<PreparedSyncSessionsContext> {
  let accessToken = integration.access_token

  if (needsCalendarTokenRefresh(integration.expires_at)) {
    if (!integration.refresh_token) {
      throw new Error(
        'Token expirado y no hay refresh token disponible. Por favor, reconecta tu calendario.',
      )
    }

    const refreshResult = await refreshCalendarAccessToken(supabase, integration)
    if (!refreshResult.success || !refreshResult.accessToken) {
      throw new Error(
        'Token expirado y no se pudo refrescar. Por favor, reconecta tu calendario.',
      )
    }

    accessToken = refreshResult.accessToken
  }

  let secondaryCalendarId =
    integration.provider === 'google'
      ? integration.metadata?.secondary_calendar_id ||
        (await CalendarIntegrationService.getSecondaryCalendarId(userId))
      : null

  if (integration.provider === 'google' && !secondaryCalendarId) {
    secondaryCalendarId =
      await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken)

    if (secondaryCalendarId) {
      await persistSecondaryCalendarId(
        supabase,
        userId,
        secondaryCalendarId,
        integration.metadata,
      )
    }
  }

  return {
    sessions,
    integration,
    accessToken,
    timezone: await getPlanTimezoneForSessions(supabase, userId, sessions),
    secondaryCalendarId,
  }
}

export async function syncStudySessionsToCalendar(
  supabase: SupabaseAdminClient,
  userId: string,
  context: PreparedSyncSessionsContext,
) {
  let syncedCount = 0
  let failedCount = 0
  const errors: string[] = []
  let secondaryCalendarId = context.secondaryCalendarId

  for (const session of context.sessions) {
    try {
      const syncResult =
        context.integration.provider === 'google'
          ? await createGoogleStudySessionEvent(
              context.accessToken,
              session,
              context.timezone,
              secondaryCalendarId,
            )
          : await createMicrosoftStudySessionEvent(
              context.accessToken,
              session,
              context.timezone,
            )

      if (!syncResult.eventId) {
        failedCount += 1
        errors.push(`No se pudo crear evento para sesion: ${session.title}`)
        continue
      }

      if (
        context.integration.provider === 'google' &&
        syncResult.newSecondaryCalendarId &&
        syncResult.newSecondaryCalendarId !== secondaryCalendarId
      ) {
        secondaryCalendarId = syncResult.newSecondaryCalendarId
        await persistSecondaryCalendarId(
          supabase,
          userId,
          syncResult.newSecondaryCalendarId,
          context.integration.metadata,
        )
      }

      await markSessionAsSynced(
        supabase,
        session,
        session.id,
        context.integration.provider,
        syncResult.eventId,
        secondaryCalendarId,
      )
      syncedCount += 1
    } catch (error) {
      failedCount += 1
      errors.push(
        `Error sincronizando sesion ${session.title}: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`,
      )
    }
  }

  return {
    syncedCount,
    failedCount,
    errors,
  }
}
