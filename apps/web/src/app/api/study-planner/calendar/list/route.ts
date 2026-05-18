import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { SessionService } from '../../../../../features/auth/services/session.service'
import {
  CalendarGoogleService,
  CalendarIntegrationService,
  CalendarMicrosoftService,
} from '../../../../../features/study-planner/services/calendar-integration.service'
import type { CalendarIntegrationMetadata } from '../../../../../features/study-planner/types/user-context.types'
import {
  buildGoogleCalendarListItems,
  buildMicrosoftCalendarListItems,
  resolveDefaultSelectedCalendarIds,
  sortCalendarListItems,
} from './calendar-list-presenter.service'
import {
  createAdminClient,
  refreshAccessToken,
  type CalendarIntegrationRow,
} from './calendar-list-token.service'

const PLATFORM_CALENDAR_NAME = 'SofLIA - Sesiones de Estudio'
type CalendarProvider = 'google' | 'microsoft'

function parseProvider(value: string | null): CalendarProvider | undefined {
  return value === 'google' || value === 'microsoft' ? value : undefined
}

async function resolveConnectedAccountEmail(params: {
  provider: CalendarProvider
  accessToken: string
  metadata: CalendarIntegrationMetadata
}): Promise<string | null> {
  const { provider, accessToken, metadata } = params
  const liveAccountEmail = provider === 'google'
    ? await CalendarGoogleService.getGoogleUserEmail(accessToken)
    : await CalendarMicrosoftService.getMicrosoftUserEmail(accessToken)

  return liveAccountEmail || metadata.account_email || null
}

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const requestedProvider = parseProvider(request.nextUrl.searchParams.get('provider'))
    const supabase = createAdminClient()
    let integrationQuery = supabase
      .from('calendar_integrations')
      .select(SELECT_COLUMNS.calendar_integrations)
      .eq('user_id', user.id)

    if (requestedProvider) {
      integrationQuery = integrationQuery.eq('provider', requestedProvider)
    }

    const { data: integrations, error: integrationError } = await integrationQuery
      .order('updated_at', { ascending: false })
      .limit(1)

    if (integrationError || !integrations || integrations.length === 0) {
      return NextResponse.json({ error: 'No hay calendario conectado' }, { status: 404 })
    }

    const integration = integrations[0] as CalendarIntegrationRow
    let accessToken = integration.access_token

    const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null
    const needsRefresh = !tokenExpiry || tokenExpiry <= new Date()

    if (needsRefresh) {
      if (!integration.refresh_token) {
        return NextResponse.json({
          error: 'Token expirado. Por favor, reconecta tu calendario.',
          requiresReconnection: true,
        }, { status: 401 })
      }

      const refreshResult = await refreshAccessToken(integration)
      if (!refreshResult.success || !refreshResult.accessToken) {
        return NextResponse.json({
          error: 'No se pudo refrescar el token. Por favor, reconecta tu calendario.',
          requiresReconnection: true,
        }, { status: 401 })
      }

      accessToken = refreshResult.accessToken
    }

    const metadata = (integration.metadata || {}) as CalendarIntegrationMetadata
    const accountEmail = accessToken
      ? await resolveConnectedAccountEmail({
          provider: integration.provider,
          accessToken,
          metadata,
        })
      : (metadata.account_email || null)
    const providerAccountId = accountEmail
      || metadata.provider_account_id
      || metadata.account_email
      || integration.id

    if (accountEmail && accountEmail !== metadata.account_email) {
      await supabase
        .from('calendar_integrations')
        .update({
          metadata: {
            ...metadata,
            account_email: accountEmail,
            provider_account_id: accountEmail,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
    }

    const calendars = await loadCalendarList({
      accessToken,
      accountEmail,
      integration,
      metadata,
      providerAccountId,
    })
    const sortedCalendars = sortCalendarListItems(calendars)
    const selectionResult = await resolveSelectedCalendarIds({
      calendars: sortedCalendars,
      integration,
      metadata,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        calendars: sortedCalendars,
        selectedIds: selectionResult.selectedIds,
        provider: integration.provider,
        staleIdsRemoved: selectionResult.staleIdsRemoved,
      },
    })
  } catch (error) {
    logger.error('[Calendar List] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

async function loadCalendarList(params: {
  accessToken: string | null
  accountEmail: string | null
  integration: CalendarIntegrationRow
  metadata: CalendarIntegrationMetadata
  providerAccountId: string
}) {
  const { accessToken, accountEmail, integration, metadata, providerAccountId } = params

  if (!accessToken) {
    return []
  }

  if (integration.provider === 'google') {
    const googleCalendars = await CalendarIntegrationService.getGoogleCalendarList(accessToken)

    return buildGoogleCalendarListItems({
      accountEmail,
      calendars: googleCalendars.filter((calendar) => {
        const isSofliaCalendar = calendar.summary.toLowerCase() === PLATFORM_CALENDAR_NAME.toLowerCase()
          || calendar.id === metadata.secondary_calendar_id

        return !isSofliaCalendar
      }),
      providerAccountId,
    })
  }

  const microsoftCalendars = await CalendarIntegrationService.getMicrosoftCalendarList(accessToken)

  return buildMicrosoftCalendarListItems({
    accountEmail,
    calendars: microsoftCalendars,
    providerAccountId,
  })
}

async function resolveSelectedCalendarIds(params: {
  calendars: Array<{ id: string; isConnectedAccountPrimary?: boolean; isPrimary: boolean }>
  integration: CalendarIntegrationRow
  metadata: CalendarIntegrationMetadata
  userId: string
}): Promise<{ selectedIds: string[]; staleIdsRemoved: boolean }> {
  const { calendars, integration, metadata, userId } = params
  let selectedIds = metadata.selected_calendar_ids || null
  let staleIdsRemoved = false

  if (!selectedIds) {
    return {
      selectedIds: resolveDefaultSelectedCalendarIds(calendars),
      staleIdsRemoved,
    }
  }

  const validIds = new Set(calendars.map((calendar) => calendar.id))
  const cleanedIds = selectedIds.filter((id) => validIds.has(id))

  if (cleanedIds.length !== selectedIds.length) {
    await CalendarIntegrationService.saveSelectedCalendarIds(
      userId,
      cleanedIds,
      integration.provider,
    )
    selectedIds = cleanedIds
    staleIdsRemoved = true
  }

  return {
    selectedIds,
    staleIdsRemoved,
  }
}
