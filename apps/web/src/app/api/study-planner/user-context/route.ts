/**
 * API Endpoint: User Context for Study Planner
 *
 * GET /api/study-planner/user-context
 *
 * Obtiene el contexto completo del usuario para el planificador de estudios,
 * incluyendo tipo (B2B/B2C), perfil profesional, cursos y preferencias.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '../../../../features/auth/services/session.service'
import { buildStudyPlannerUserContext } from '../../../../features/study-planner/services/study-planner-user-context.server.service'
import type { UserContextResponse } from '../../../../features/study-planner/types/user-context.types'

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<UserContextResponse>> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      )
    }

    const userContext = await buildStudyPlannerUserContext(user.id)

    return NextResponse.json({
      success: true,
      data: userContext,
    })
  } catch (error) {
    console.error('[user-context] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    )
  }
}
