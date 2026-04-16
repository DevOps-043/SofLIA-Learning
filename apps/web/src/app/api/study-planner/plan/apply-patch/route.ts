import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { parseStudyPlanApplyPatchRequest } from './study-plan-apply-patch.utils'
import { applyStudyPlanPatchForUser } from './study-plan-apply-patch.server.service'

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const payload = parseStudyPlanApplyPatchRequest(await request.json())
    const result = await applyStudyPlanPatchForUser({
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
        updatedSessions:
          result.updatedSessions.length > 0 ? result.updatedSessions : undefined,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error interno del servidor'

    const status =
      message === 'planId y operations son requeridos' ||
      message.includes('requiere') ||
      message.includes('Operacion no soportada')
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
