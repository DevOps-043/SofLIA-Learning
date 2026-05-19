import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'
import { logger } from '@/lib/utils/logger'
import {
  companyUserAssignmentParamsSchema,
  userCourseAssignmentSchema,
  type UserCourseAssignmentBody,
} from './schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function handlePost(
  _request: NextRequest,
  body: UserCourseAssignmentBody,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId } = companyUserAssignmentParamsSchema.parse(await params)
    const assignment = await AdminCompaniesService.assignCourseToUser(
      companyId,
      body.userId,
      body.courseId,
      auth.userId,
    )

    return NextResponse.json({
      success: true,
      assignment,
    })
  } catch (error) {
    logger.error('Error in POST /api/admin/companies/[id]/user-assignments:', error)
    if (error instanceof ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        'La solicitud no cumple el contrato esperado.',
        422,
        { details: error.flatten() },
      )
    }

    return apiError(
      'ADMIN_USER_COURSE_ASSIGN_FAILED',
      'Error al asignar curso al usuario.',
      500,
    )
  }
}

export const POST = withZodBody(userCourseAssignmentSchema, handlePost)
