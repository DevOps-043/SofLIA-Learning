import { NextRequest } from 'next/server'
import { SessionService } from '../../../../../features/auth/services/session.service'
import type { ActionRequest, ActionResponse } from './dashboard-action.types'
import {
  createDashboardActionAdminClient,
  ensureAuthorizedPlan,
} from './dashboard-action-db.service'
import { executeDashboardAction } from './dashboard-action-executor.service'
import {
  buildActionErrorResponse,
  buildActionSuccessResponse,
} from './dashboard-action-response.service'

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return buildActionErrorResponse('No autenticado', 401)
    }

    const body = (await request.json()) as Partial<ActionRequest> & { data?: unknown }
    const { action, planId } = body

    if (!action || !planId) {
      return buildActionErrorResponse('Accion y planId son requeridos', 400)
    }

    const supabase = createDashboardActionAdminClient()
    const { plan, error: planError } = await ensureAuthorizedPlan({
      supabase,
      planId,
      userId: user.id,
    })

    if (planError || !plan) {
      return buildActionErrorResponse('Plan no encontrado o no autorizado', 404)
    }

    const result = await executeDashboardAction({
      body,
      planId,
      supabase,
      userId: user.id,
    })

    if (!result.ok) {
      return buildActionErrorResponse(result.error, result.status)
    }

    return buildActionSuccessResponse({
      message: result.message,
      ...(result.data ? { data: result.data } : {}),
    })
  } catch (error) {
    return buildActionErrorResponse(
      error instanceof Error ? error.message : 'Error interno del servidor',
      500,
    )
  }
}
