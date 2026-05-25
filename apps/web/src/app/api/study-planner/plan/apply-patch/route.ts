import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import {
  studyPlanApplyPatchSchema,
  type StudyPlanApplyPatchBody,
} from '../../_schemas'
import { applyStudyPlanPatchForUser } from './study-plan-apply-patch.server.service'

async function handlePost(
  _request: NextRequest,
  payload: StudyPlanApplyPatchBody,
): Promise<Response> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401)
    }

    const result = await applyStudyPlanPatchForUser({
      userId: user.id,
      request: payload,
    })

    if (result.kind === 'plan_not_found') {
      return apiError(
        'PLAN_NOT_FOUND',
        'Plan no encontrado o no autorizado',
        404,
      )
    }

    if (result.kind === 'no_sessions') {
      return apiError(
        'NO_SESSIONS_FOUND',
        'No se encontraron sesiones para actualizar',
        404,
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

    return apiError('APPLY_STUDY_PLAN_PATCH_FAILED', message, status)
  }
}

export const POST = withZodBody(studyPlanApplyPatchSchema, handlePost)
