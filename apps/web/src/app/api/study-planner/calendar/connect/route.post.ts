import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API Endpoint: Connect Calendar
 *
 * POST /api/study-planner/calendar/connect
 *
 * Inicia el proceso de conexion de calendario (Google o Microsoft)
 * Retorna la URL de autorizacion OAuth.
 *
 * GET /api/study-planner/calendar/connect?code=&state=
 *
 * Callback para completar la conexion OAuth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'

import { SessionService } from '../../../../../features/auth/services/session.service'

import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import { connectCalendarSchema, type ConnectCalendarBody } from '../../_schemas'

interface ConnectCalendarResponse {
  success: boolean
  data?: {
    authUrl: string
  }
  error?: string
}

async function handlePost(
  _request: NextRequest,
  body: ConnectCalendarBody,
): Promise<NextResponse<ConnectCalendarResponse> | Response> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const authUrl = body.provider === 'google'
      ? CalendarIntegrationService.getGoogleAuthUrl(user.id)
      : CalendarIntegrationService.getMicrosoftAuthUrl(user.id)

    return NextResponse.json({
      success: true,
      data: { authUrl },
    })
  } catch (error) {
    techDebtLogger.error('Error iniciando conexion de calendario:', error)
    return apiError('CONNECT_CALENDAR_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(connectCalendarSchema, handlePost)
