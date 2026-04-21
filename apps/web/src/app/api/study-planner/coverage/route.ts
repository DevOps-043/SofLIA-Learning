import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { getStudyPlannerCoverageForPlan } from '@/features/study-planner/services/study-planner-coverage.server.service'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      )
    }

    const planId = request.nextUrl.searchParams.get('planId')?.trim()
    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'planId es requerido' },
        { status: 400 },
      )
    }

    const coverage = await getStudyPlannerCoverageForPlan({
      planId,
      userId: user.id,
    })

    if (!coverage) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado o no autorizado' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: coverage,
    })
  } catch (error) {
    logger.error('Error calculando cobertura del planificador:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
      },
      { status: 500 },
    )
  }
}
