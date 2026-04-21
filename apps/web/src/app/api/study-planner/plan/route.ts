import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '../../../../features/auth/services/session.service'
import { deleteStudyPlanForUser } from './plan-delete.server.service'
import type { DeletePlanResponse } from './plan-delete.types'

export async function DELETE(
  request: NextRequest,
): Promise<NextResponse<DeletePlanResponse>> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const requestedPlanId =
      request.nextUrl.searchParams.get('planId')
      || ((await request.json().catch(() => ({}))) as { planId?: string }).planId
      || null

    if (!requestedPlanId) {
      return NextResponse.json(
        {
          success: false,
          error: 'planId es requerido para eliminar un plan',
        },
        { status: 400 },
      )
    }

    const result = await deleteStudyPlanForUser({
      userId: user.id,
      planId: requestedPlanId,
    })

    if (result.status === 'not_found') {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 404 },
      )
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    )
  }
}
