import { NextRequest, NextResponse } from 'next/server'

import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import { SessionService } from '../../../../../features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger as techDebtLogger } from '@/lib/utils/logger'

import { calendarSelectionSchema, type CalendarSelectionBody } from '../../_schemas'

type CalendarProvider = 'google' | 'microsoft'

function parseProvider(value: string | null): CalendarProvider | undefined {
  return value === 'google' || value === 'microsoft' ? value : undefined
}

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401)
    }

    const provider = parseProvider(request.nextUrl.searchParams.get('provider'))
    const selectedIds = await CalendarIntegrationService.getSelectedCalendarIds(
      user.id,
      provider,
    )

    return NextResponse.json({
      success: true,
      data: {
        selectedCalendarIds: selectedIds || [],
      },
    })
  } catch (error) {
    techDebtLogger.error('[Calendar Selection] Error GET:', error)
    return apiError(
      'CALENDAR_SELECTION_FETCH_FAILED',
      'Error interno del servidor',
      500,
    )
  }
}

async function handlePost(
  _request: NextRequest,
  body: CalendarSelectionBody,
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401)
    }

    await CalendarIntegrationService.saveSelectedCalendarIds(
      user.id,
      body.selectedCalendarIds,
      body.provider,
    )

    return NextResponse.json({
      success: true,
      data: {
        selectedCalendarIds: body.selectedCalendarIds,
      },
    })
  } catch (error) {
    techDebtLogger.error('[Calendar Selection] Error POST:', error)
    return apiError(
      'CALENDAR_SELECTION_SAVE_FAILED',
      'Error interno del servidor',
      500,
    )
  }
}

export const POST = withZodBody(calendarSelectionSchema, handlePost)
