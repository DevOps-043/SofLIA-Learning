import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import {
  addLearningPathItemSchema,
  learningPathParamsSchema,
  type AddLearningPathItemBody,
} from './schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function handlePost(
  _request: NextRequest,
  body: AddLearningPathItemBody,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = learningPathParamsSchema.parse(await params)

    const item = await AdminLearningPathsService.addItem(id, body.courseId, auth.userId)
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    logger.error('Error adding learning path item:', error)
    return apiError(
      'ADMIN_LEARNING_PATH_ITEM_ADD_FAILED',
      error instanceof Error
        ? error.message
        : 'Error al agregar el taller al learning path.',
      400,
    )
  }
}

export const POST = withZodBody(addLearningPathItemSchema, handlePost)
