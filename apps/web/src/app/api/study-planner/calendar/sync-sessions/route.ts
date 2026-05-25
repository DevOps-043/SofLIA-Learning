import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
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
  SyncSessionsResponse,
} from './sync-sessions.types'
import { syncSessionsSchema, type SyncSessionsBody } from '../../_schemas'

async function handlePost(
  _request: NextRequest,
  payload: SyncSessionsBody,
): Promise<Response> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const supabase = createCalendarAdminClient()
    const sessions = await getSyncSessionsForUser(
      supabase,
      user.id,
      payload.sessionIds,
    )

    if (sessions.length === 0) {
      return apiError(
        'SYNC_SESSIONS_NOT_FOUND',
        'No se encontraron sesiones para sincronizar',
        404,
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

    return apiError('SYNC_SESSIONS_FAILED', message, status)
  }
}

export const POST = withZodBody(syncSessionsSchema, handlePost)
