import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

import {
  AdminActivitiesService,
  type UpdateActivityData,
} from '@/features/admin/services/adminActivities.service'
import { validateUpdateActivityPayload } from '@/features/admin/services/adminActivityPayload.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const activityBodySchema = z.record(z.unknown())
type ActivityBody = z.infer<typeof activityBodySchema>

type RouteContext = { params: Promise<{ activityId: string }> }

async function handlePut(
  _request: NextRequest,
  rawBody: ActivityBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { activityId } = await context.params
  if (!activityId) {
    return apiError('ACTIVITY_ID_REQUIRED', 'activityId es requerido', 400)
  }

  let body: UpdateActivityData
  try {
    body = validateUpdateActivityPayload(rawBody) as UpdateActivityData
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        error.issues[0]?.message || 'Payload de actividad inválido',
        400,
      )
    }
    throw error
  }

  try {
    const activity = await AdminActivitiesService.updateActivity(activityId, body)
    return NextResponse.json({ success: true, activity })
  } catch (error) {
    if (error instanceof Error && error.message.includes('external_tool_key')) {
      return apiError('EXTERNAL_TOOL_KEY_INVALID', error.message, 400)
    }
    return apiError('UPDATE_ACTIVITY_FAILED', 'Error al actualizar actividad', 500)
  }
}

export const PUT = withZodBody(activityBodySchema, handlePut)

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { activityId } = await context.params
  if (!activityId) {
    return apiError('ACTIVITY_ID_REQUIRED', 'activityId es requerido', 400)
  }

  try {
    await AdminActivitiesService.deleteActivity(activityId)
    return NextResponse.json({ success: true })
  } catch {
    return apiError('DELETE_ACTIVITY_FAILED', 'Error al eliminar actividad', 500)
  }
}
