import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { confirmActionSchema, type ConfirmActionBody } from '../../../_schemas'
import { executeDashboardAction } from '../chat-actions.service'
import type { ActionResult, ActionType } from '../types'

async function handlePost(
  _request: NextRequest,
  body: ConfirmActionBody,
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const supabase = createAdminClient()
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', body.planId)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return apiError(
        'PLAN_NOT_FOUND',
        'Plan no encontrado o no autorizado',
        404,
      )
    }

    const action: ActionResult = {
      data: body.data || {},
      status: 'pending',
      traceId: body.traceId,
      type: body.action as ActionType,
    }

    const result = await executeDashboardAction(
      user.id,
      body.planId,
      action,
      body.userMessage,
      {
        confirmed: true,
        traceId: body.traceId,
      },
    )

    logger.info('[StudyPlanner] Resultado de accion confirmada', {
      actionType: result.type,
      confirmationState: 'confirmed',
      planId: body.planId,
      status: result.status,
      traceId: body.traceId,
      userId: user.id,
    })

    return NextResponse.json({
      success: result.status === 'success',
      action: result,
      message: result.message,
      error: result.status === 'error' ? result.message : undefined,
      traceId: body.traceId,
    })
  } catch (error) {
    logger.error('Error confirmando accion del dashboard:', error)
    return apiError('CONFIRM_DASHBOARD_ACTION_FAILED', 'Error interno', 500)
  }
}

const validatedPost = withZodBody(confirmActionSchema, handlePost)

export function POST(request: NextRequest, context: unknown) {
  if (process.env.STUDY_PLANNER_ACTIONS_READONLY === 'true') {
    return apiError(
      'STUDY_PLANNER_ACTIONS_READONLY',
      'Las acciones del planificador estan en modo solo lectura.',
      409,
    )
  }

  return validatedPost(request, context)
}
