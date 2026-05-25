import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'
import { logger } from '@/lib/utils/logger'
import {
  companyCourseParamsSchema,
  companyCourseAssignmentSchema,
  type CompanyCourseAssignmentBody,
} from './schema'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

async function handlePost(
  _request: NextRequest,
  body: CompanyCourseAssignmentBody,
  { params }: RouteParams,
): Promise<Response> {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: companyId } = companyCourseParamsSchema.parse(await params)
    const assignment = await AdminCompaniesService.assignCourseToCompany(
      companyId,
      body.courseId,
      auth.userId,
    )

    return NextResponse.json({
      success: true,
      assignment,
    })
  } catch (error) {
    logger.error('Error assigning course to company:', error)
    if (error instanceof ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        'La solicitud no cumple el contrato esperado.',
        422,
        { details: error.flatten() },
      )
    }

    return apiError(
      'ADMIN_ORGANIZATION_COURSE_ASSIGN_FAILED',
      'Error al asignar el curso.',
      500,
    )
  }
}

export const POST = withZodBody(companyCourseAssignmentSchema, handlePost)
