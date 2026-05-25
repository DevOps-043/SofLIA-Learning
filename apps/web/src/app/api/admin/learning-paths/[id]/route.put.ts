import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import {
  learningPathParamsSchema,
  learningPathUpdateSchema,
  type LearningPathUpdateBody,
} from './schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function handlePut(
  _request: NextRequest,
  body: LearningPathUpdateBody,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = learningPathParamsSchema.parse(await params)
    const learningPath = await AdminLearningPathsService.updateLearningPath(id, body)

    return NextResponse.json({ success: true, learningPath })
  } catch (error) {
    logger.error('Error updating learning path:', error)
    return apiError(
      'ADMIN_LEARNING_PATH_UPDATE_FAILED',
      error instanceof Error ? error.message : 'Error al actualizar el learning path.',
      400,
    )
  }
}

export const PUT = withZodBody(learningPathUpdateSchema, handlePut)
