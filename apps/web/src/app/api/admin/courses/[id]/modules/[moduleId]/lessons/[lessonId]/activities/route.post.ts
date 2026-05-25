import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import {
  AdminActivitiesService,
  type CreateActivityData,
} from '@/features/admin/services/adminActivities.service'
import { validateCreateActivityPayload } from '@/features/admin/services/adminActivityPayload.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

import { activityBodySchema, type ActivityBody } from './schema'

type RouteContext = {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>
}

async function handlePost(
  _request: NextRequest,
  rawBody: ActivityBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { lessonId } = await context.params
  if (!lessonId) {
    return apiError('LESSON_ID_REQUIRED', 'Lesson ID es requerido', 400)
  }

  let body: CreateActivityData
  try {
    body = validateCreateActivityPayload(rawBody) as CreateActivityData
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

  if (!body.activity_title || !body.activity_type || !body.activity_content) {
    return apiError(
      'ACTIVITY_FIELDS_REQUIRED',
      'activity_title, activity_type y activity_content son requeridos',
      400,
    )
  }

  try {
    const activity = await AdminActivitiesService.createActivity(
      lessonId,
      body,
      auth.userId,
    )
    return NextResponse.json({ success: true, activity })
  } catch (error) {
    if (error instanceof Error && error.message.includes('external_tool_key')) {
      return apiError('EXTERNAL_TOOL_KEY_INVALID', error.message, 400)
    }
    return apiError('CREATE_ACTIVITY_FAILED', 'Error al crear actividad', 500)
  }
}

export const POST = withZodBody(activityBodySchema, handlePost)
