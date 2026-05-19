import { NextRequest, NextResponse } from 'next/server'

import { AdminCheckpointsService } from '@/features/admin/services/adminCheckpoints.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

import {
  createCheckpointSchema,
  type CreateCheckpointBody,
} from './schema'

type RouteContext = {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { lessonId } = await context.params
  if (!lessonId) {
    return apiError('LESSON_ID_REQUIRED', 'Lesson ID es requerido', 400)
  }

  try {
    const checkpoints = await AdminCheckpointsService.getLessonCheckpoints(lessonId)
    return NextResponse.json({ success: true, checkpoints })
  } catch {
    return apiError('LIST_CHECKPOINTS_FAILED', 'Error al obtener checkpoints', 500)
  }
}

async function handlePost(
  _request: NextRequest,
  body: CreateCheckpointBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { lessonId } = await context.params
  if (!lessonId) {
    return apiError('LESSON_ID_REQUIRED', 'Lesson ID es requerido', 400)
  }

  try {
    const checkpoint = await AdminCheckpointsService.createCheckpoint(lessonId, body)
    return NextResponse.json({ success: true, checkpoint })
  } catch {
    return apiError('CREATE_CHECKPOINT_FAILED', 'Error al crear checkpoint', 500)
  }
}

export const POST = withZodBody(createCheckpointSchema, handlePost)
