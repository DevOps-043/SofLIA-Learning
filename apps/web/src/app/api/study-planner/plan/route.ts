import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { SessionService } from '../../../../features/auth/services/session.service'
import { deletePlanSchema, type DeletePlanBody } from '../_schemas'
import { deleteStudyPlanForUser } from './plan-delete.server.service'
import type { DeletePlanResponse } from './plan-delete.types'

async function handleDelete(
  request: NextRequest,
  body: DeletePlanBody,
): Promise<NextResponse<DeletePlanResponse> | Response> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const requestedPlanId =
      request.nextUrl.searchParams.get('planId')
      || body.planId
      || null

    if (!requestedPlanId) {
      return apiError(
        'PLAN_ID_REQUIRED',
        'planId es requerido para eliminar un plan',
        400,
      )
    }

    const result = await deleteStudyPlanForUser({
      userId: user.id,
      planId: requestedPlanId,
    })

    if (result.status === 'not_found') {
      return apiError('PLAN_NOT_FOUND', result.error, 404)
    }

    if (result.status === 'error') {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          deletedPlanId: result.planId,
          deletedSessionsCount: result.deletedSessionsCount,
          deletedCalendarEventsCount: result.deletedCalendarEventsCount,
          calendarDeletionErrors: result.calendarDeletionErrors,
          calendarEventsNotFound: result.calendarEventsNotFound,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: result.ok,
      message: result.ok
        ? 'Plan de estudio eliminado exitosamente'
        : 'El plan se elimino de la base de datos, pero hubo errores eliminando algunos eventos del calendario.',
      deletedPlanId: result.planId,
      deletedSessionsCount: result.deletedSessionsCount,
      deletedCalendarEventsCount: result.deletedCalendarEventsCount,
      calendarDeletionErrors: result.calendarDeletionErrors,
      calendarEventsNotFound: result.calendarEventsNotFound,
    })
  } catch (error) {
    return apiError(
      'DELETE_PLAN_FAILED',
      error instanceof Error ? error.message : 'Error interno del servidor',
      500,
    )
  }
}

export const DELETE = withZodBody(deletePlanSchema, handleDelete, {
  emptyBodyFallback: {},
})
