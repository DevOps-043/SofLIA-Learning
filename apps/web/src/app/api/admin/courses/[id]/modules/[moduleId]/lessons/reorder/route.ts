import { NextRequest, NextResponse } from 'next/server'

import { AdminLessonsService } from '@/features/admin/services/adminLessons.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

import {
  reorderLessonsSchema,
  type ReorderLessonsBody,
} from '../schema'

type RouteContext = { params: Promise<{ id: string; moduleId: string }> }

async function handlePost(
  _request: NextRequest,
  body: ReorderLessonsBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { moduleId } = await context.params
  if (!moduleId) {
    return apiError('MODULE_ID_REQUIRED', 'Module ID es requerido', 400)
  }

  try {
    await AdminLessonsService.reorderLessons(moduleId, body.lessons)
    return NextResponse.json({
      success: true,
      message: 'Lecciones reordenadas correctamente',
    })
  } catch (error) {
    logger.error(
      'Error in POST /api/admin/courses/[id]/modules/[moduleId]/lessons/reorder',
      error,
    )
    return apiError('REORDER_LESSONS_FAILED', 'Error al reordenar lecciones', 500)
  }
}

export const POST = withZodBody(reorderLessonsSchema, handlePost)
