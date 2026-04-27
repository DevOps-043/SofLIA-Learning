import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '../../../../../features/auth/services/session.service'
import {
  createCalendarAdminClient,
  getActiveStudySessionEventIds,
  getLatestCalendarIntegration,
  getOrphanedCalendarEventIds,
  getStudySessionCalendarEvents,
} from './calendar-events.db'
import { refreshCalendarAccessToken } from './calendar-events-oauth.service'
import {
  getGoogleCalendarEvents,
  getMicrosoftCalendarEvents,
} from './calendar-events-provider.service'
import { syncDeletedStudySessions } from './calendar-events-sync.service'
import {
  filterOrphanedCalendarEvents,
  needsCalendarTokenRefresh,
  parseCalendarDateRange,
} from './calendar-events.utils'

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const includeStudySessions =
      request.nextUrl.searchParams.get('includeStudySessions') === 'true'
    const { startDate, endDate } = parseCalendarDateRange(request.url)
    const supabase = createCalendarAdminClient()
    const integration = await getLatestCalendarIntegration(supabase, user.id)

    if (!integration) {
      const databaseStudySessionEvents = includeStudySessions
        ? await getStudySessionCalendarEvents(
            supabase,
            user.id,
            startDate,
            endDate,
          )
        : []

      return NextResponse.json({
        events: databaseStudySessionEvents,
        message: 'No hay calendario conectado',
      })
    }

    let accessToken = integration.access_token
    if (needsCalendarTokenRefresh(integration.expires_at)) {
      if (!integration.refresh_token) {
        return NextResponse.json(
          {
            error:
              'Token expirado y no hay refresh token disponible. Por favor, reconecta tu calendario.',
            events: [],
            requiresReconnection: true,
          },
          { status: 401 },
        )
      }

      const refreshResult = await refreshCalendarAccessToken(
        supabase,
        integration,
      )

      if (!refreshResult.success || !refreshResult.accessToken) {
        return NextResponse.json(
          {
            error:
              'Token expirado y no se pudo refrescar. Por favor, reconecta tu calendario.',
            events: [],
            requiresReconnection: true,
          },
          { status: 401 },
        )
      }

      accessToken = refreshResult.accessToken
    }

    await syncDeletedStudySessions(
      supabase,
      user.id,
      startDate,
      endDate,
      accessToken,
      integration,
    )

    const metadata = integration.metadata || null
    const events =
      integration.provider === 'google'
        ? await getGoogleCalendarEvents(
            accessToken,
            startDate,
            endDate,
            metadata?.secondary_calendar_id,
            metadata?.selected_calendar_ids,
          )
        : await getMicrosoftCalendarEvents(
            accessToken,
            startDate,
            endDate,
            metadata?.selected_calendar_ids,
          )

    const activeEventIds = await getActiveStudySessionEventIds(
      supabase,
      user.id,
      integration.provider,
    )
    const orphanedEventIds = await getOrphanedCalendarEventIds(
      supabase,
      user.id,
      integration.provider,
      activeEventIds,
    )
    const nonOrphanedExternalEvents = filterOrphanedCalendarEvents(events, orphanedEventIds)
    const databaseStudySessionEvents = includeStudySessions
      ? await getStudySessionCalendarEvents(
          supabase,
          user.id,
          startDate,
          endDate,
        )
      : []
    const finalEvents = [
      ...nonOrphanedExternalEvents,
      ...databaseStudySessionEvents,
    ].sort(
      (left, right) =>
        new Date(left.start).getTime() - new Date(right.start).getTime(),
    )

    return NextResponse.json({
      events: finalEvents,
      provider: integration.provider,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalEvents: finalEvents.length,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('SCOPE_INSUFFICIENT')
    ) {
      return NextResponse.json(
        {
          error: error.message.replace('SCOPE_INSUFFICIENT: ', ''),
          events: [],
          requiresReconnection: true,
          reason: 'SCOPE_INSUFFICIENT',
        },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error interno del servidor',
        events: [],
      },
      { status: 500 },
    )
  }
}
