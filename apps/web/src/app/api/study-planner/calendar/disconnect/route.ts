import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API Endpoint: Disconnect Calendar
 *
 * POST /api/study-planner/calendar/disconnect
 *
 * Desconecta el calendario del usuario.
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { SessionService } from '../../../../../features/auth/services/session.service'
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import { disconnectCalendarSchema, type DisconnectCalendarBody } from '../../_schemas'

interface DisconnectCalendarResponse {
  success: boolean
  message?: string
  error?: string
}

async function handlePost(
  _request: NextRequest,
  body: DisconnectCalendarBody,
): Promise<NextResponse<DisconnectCalendarResponse> | Response> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const success = await CalendarIntegrationService.disconnectCalendar(
      user.id,
      body.provider,
    )

    if (!success) {
      return apiError(
        'DISCONNECT_CALENDAR_FAILED',
        'No se pudo desconectar el calendario',
        500,
      )
    }

    return NextResponse.json({
      success: true,
      message: body.provider
        ? `Calendario de ${body.provider === 'google' ? 'Google' : 'Microsoft'} desconectado exitosamente`
        : 'Calendario desconectado exitosamente',
    })
  } catch (error) {
    techDebtLogger.error('Error desconectando calendario:', error)
    return apiError('DISCONNECT_CALENDAR_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(disconnectCalendarSchema, handlePost, {
  emptyBodyFallback: {},
})
