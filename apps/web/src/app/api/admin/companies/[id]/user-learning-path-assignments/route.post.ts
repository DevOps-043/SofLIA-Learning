import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import {
  assignUserLearningPathSchema,
  companyLearningPathParamsSchema,
  type AssignUserLearningPathBody,
} from './schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function handlePost(
  _request: NextRequest,
  body: AssignUserLearningPathBody,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = companyLearningPathParamsSchema.parse(await params)

    const assignment = await AdminLearningPathsService.assignToUser(
      id,
      body.userId,
      body.learningPathId,
      auth.userId,
    )

    return NextResponse.json({ success: true, assignment }, { status: 201 })
  } catch (error) {
    logger.error('Error assigning learning path to user:', error)
    return apiError(
      'ADMIN_USER_LEARNING_PATH_ASSIGN_FAILED',
      error instanceof Error
        ? error.message
        : 'Error al asignar learning path al usuario.',
      400,
    )
  }
}

export const POST = withZodBody(assignUserLearningPathSchema, handlePost)
