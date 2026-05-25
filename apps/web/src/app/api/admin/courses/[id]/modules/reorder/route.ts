import { NextRequest, NextResponse } from 'next/server'

import { AdminModulesService } from '@/features/admin/services/adminModules.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

import {
  reorderModulesSchema,
  type ReorderModulesBody,
} from '../schema'

type RouteContext = { params: Promise<{ id: string }> }

async function handlePost(
  _request: NextRequest,
  body: ReorderModulesBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: courseId } = await context.params
  if (!courseId) {
    return apiError('COURSE_ID_REQUIRED', 'Course ID es requerido', 400)
  }

  try {
    await AdminModulesService.reorderModules(courseId, body.modules)
    return NextResponse.json({
      success: true,
      message: 'Módulos reordenados correctamente',
    })
  } catch (error) {
    logger.error(
      'Error in POST /api/admin/courses/[id]/modules/reorder',
      error,
    )
    return apiError('REORDER_MODULES_FAILED', 'Error al reordenar módulos', 500)
  }
}

export const POST = withZodBody(reorderModulesSchema, handlePost)
