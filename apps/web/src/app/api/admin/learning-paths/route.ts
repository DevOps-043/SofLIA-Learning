import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import {
  learningPathCreateSchema,
  type LearningPathCreateBody,
} from './schema'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const learningPaths = await AdminLearningPathsService.listLearningPaths()
    return NextResponse.json({ success: true, learningPaths })
  } catch (error) {
    logger.error('Error fetching learning paths:', error)
    return apiError(
      'ADMIN_LEARNING_PATHS_FETCH_FAILED',
      'Error al obtener los learning paths.',
      500,
    )
  }
}

async function handlePost(
  _request: NextRequest,
  body: LearningPathCreateBody,
): Promise<Response> {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const learningPath = await AdminLearningPathsService.createLearningPath(
      body,
      auth.userId,
    )

    return NextResponse.json({ success: true, learningPath }, { status: 201 })
  } catch (error) {
    logger.error('Error creating learning path:', error)
    return apiError(
      'ADMIN_LEARNING_PATH_CREATE_FAILED',
      error instanceof Error ? error.message : 'Error al crear el learning path.',
      400,
    )
  }
}

export const POST = withZodBody(learningPathCreateSchema, handlePost)
