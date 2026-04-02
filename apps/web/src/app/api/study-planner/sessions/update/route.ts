import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import {
  parseUpdateSessionRequest,
} from './study-planner-session-update.utils'
import {
  updateStudyPlannerSessionsForUser,
} from './study-planner-session-update.server.service'

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
        },
        { status: 401 },
      )
    }

    const payload = parseUpdateSessionRequest(await request.json())
    const result = await updateStudyPlannerSessionsForUser({
      userId: user.id,
      request: payload,
    })

    if (result.kind === 'plan_not_found') {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan no encontrado o no autorizado',
        },
        { status: 404 },
      )
    }

    if (result.kind === 'no_sessions') {
      return NextResponse.json(
        {
          success: false,
          error: 'No se encontraron sesiones para actualizar',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: result.updatedCount > 0,
      data: {
        updatedCount: result.updatedCount,
        totalUpdates: result.totalUpdates,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error interno del servidor'

    const status =
      error instanceof SyntaxError ||
      message === 'planId y updates son requeridos' ||
      message ===
        'Cada actualizacion requiere dateStr, originalStartTime, newStartTime y newEndTime'
        ? 400
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
