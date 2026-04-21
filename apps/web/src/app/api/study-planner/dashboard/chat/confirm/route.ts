import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SessionService } from '@/features/auth/services/session.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { executeDashboardAction } from '../chat-actions.service'
import type { ActionResult, ActionType } from '../types'

const confirmActionSchema = z.object({
  action: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  planId: z.string().min(1),
  traceId: z.string().optional(),
  userMessage: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (process.env.STUDY_PLANNER_ACTIONS_READONLY === 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Las acciones del planificador estan en modo solo lectura.',
        },
        { status: 409 },
      )
    }

    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      )
    }

    const parsed = confirmActionSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Payload invalido',
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', parsed.data.planId)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado o no autorizado' },
        { status: 404 },
      )
    }

    const action: ActionResult = {
      data: parsed.data.data || {},
      status: 'pending',
      traceId: parsed.data.traceId,
      type: parsed.data.action as ActionType,
    }

    const result = await executeDashboardAction(
      user.id,
      parsed.data.planId,
      action,
      parsed.data.userMessage,
      {
        confirmed: true,
        traceId: parsed.data.traceId,
      },
    )

    logger.info('[StudyPlanner] Resultado de accion confirmada', {
      actionType: result.type,
      confirmationState: 'confirmed',
      planId: parsed.data.planId,
      status: result.status,
      traceId: parsed.data.traceId,
      userId: user.id,
    })

    return NextResponse.json({
      success: result.status === 'success',
      action: result,
      message: result.message,
      error: result.status === 'error' ? result.message : undefined,
      traceId: parsed.data.traceId,
    })
  } catch (error) {
    logger.error('Error confirmando accion del dashboard:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
      },
      { status: 500 },
    )
  }
}
