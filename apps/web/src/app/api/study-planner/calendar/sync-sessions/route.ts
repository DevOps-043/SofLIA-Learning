import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '../../../../../features/auth/services/session.service'
import {
  createCalendarAdminClient,
} from '../events/calendar-events.db'
import {
  getSyncCalendarIntegration,
  getSyncSessionsForUser,
} from './sync-sessions.db'
import {
  prepareSyncSessionsContext,
  syncStudySessionsToCalendar,
} from './sync-sessions.service'
import type {
  SyncSessionsRequestBody,
  SyncSessionsResponse,
} from './sync-sessions.types'
import { parseSyncSessionsRequest } from './sync-sessions.utils'

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SyncSessionsResponse>> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      )
    }

    const payload = (await request.json()) as SyncSessionsRequestBody
    const parsedRequest = parseSyncSessionsRequest(payload)

    if (parsedRequest.error || !parsedRequest.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            parsedRequest.error ||
            'sessionIds es requerido y debe ser un array no vacio',
        },
        { status: 400 },
      )
    }

    const supabase = createCalendarAdminClient()
    const sessions = await getSyncSessionsForUser(
      supabase,
      user.id,
      parsedRequest.data.sessionIds,
    )

    if (sessions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se encontraron sesiones para sincronizar',
        },
        { status: 404 },
      )
    }

    const integration = await getSyncCalendarIntegration(supabase, user.id)
    const syncContext = await prepareSyncSessionsContext({
      supabase,
      userId: user.id,
      sessions,
      integration,
    })
    const result = await syncStudySessionsToCalendar(
      supabase,
      user.id,
      syncContext,
    )

    return NextResponse.json({
      success: true,
      data: {
        syncedCount: result.syncedCount,
        failedCount: result.failedCount,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error interno del servidor'
    const status =
      message.includes('Token expirado') || message.includes('reconecta')
        ? 401
        : message === 'No hay calendario conectado'
          ? 404
          : message.startsWith('Error obteniendo sesiones:')
            ? 500
            : 500

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    )
  }
}
