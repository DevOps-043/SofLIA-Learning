import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import {
  calendarEventMutationSchema,
  type CalendarEventMutationBody,
} from '../../_schemas'
import { handleCalendarEventDelete } from './event-delete-route.handler'
import { getErrorMessage } from './event-route.types'
import { handleCalendarEventUpdate } from './event-update-route.handler'

type RouteContext = { params: Promise<{ id: string }> }

async function handlePut(
  _request: NextRequest,
  body: CalendarEventMutationBody,
  { params }: RouteContext,
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401)
    }

    const { id } = await params
    return handleCalendarEventUpdate(user.id, id, body)
  } catch (error: unknown) {
    techDebtLogger.error('Error en PUT /api/study-planner/events/[id]:', error)
    return apiError('UPDATE_CALENDAR_EVENT_FAILED', getErrorMessage(error), 500)
  }
}

export const PUT = withZodBody(calendarEventMutationSchema, handlePut)

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401)
    }

    const { id } = await params
    return handleCalendarEventDelete(user.id, id)
  } catch (error: unknown) {
    techDebtLogger.error('Error en DELETE /api/study-planner/events/[id]:', error)
    return apiError('DELETE_CALENDAR_EVENT_FAILED', getErrorMessage(error), 500)
  }
}
