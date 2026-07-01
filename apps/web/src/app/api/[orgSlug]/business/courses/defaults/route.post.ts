import { NextRequest, NextResponse } from 'next/server'

import { CourseDefaultsService } from '@/features/courses/services/course-defaults.server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'

import { logger } from '@/lib/utils/logger'
import {
  createCourseDefaultRuleSchema,
  type CreateCourseDefaultRuleBody,
} from '../../_schemas'

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

async function requireOrgAdmin(orgSlug: string) {
  const auth = await requireBusiness({ organizationSlug: orgSlug })
  if (auth instanceof NextResponse) return auth

  if (!auth.organizationId) {
    return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
  }

  if (!auth.isOrgAdmin) {
    return apiError(
      'FORBIDDEN',
      'No tienes permisos para gestionar cursos predeterminados',
      403,
    )
  }

  return auth
}

async function handlePost(
  _request: NextRequest,
  body: CreateCourseDefaultRuleBody,
  { params }: RouteParams,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireOrgAdmin(orgSlug)
    if (auth instanceof NextResponse) return auth

    const ruleId = await CourseDefaultsService.createOrReactivateDefaultRule({
      organizationId: auth.organizationId,
      courseId: body.courseId,
      scopeType: body.scopeType,
      nodeId: body.nodeId,
      includeDescendants: body.includeDescendants ?? true,
      createdBy: auth.userId,
    })

    const applyResult = body.applyNow
      ? await CourseDefaultsService.applyDefaultRules({
          organizationId: auth.organizationId,
          ruleIds: [ruleId],
          appliedBy: auth.userId,
        })
      : null

    return NextResponse.json({
      success: true,
      ruleId,
      applyResult,
    }, { status: 201 })
  } catch (error) {
    logger.error('Error creating course default rule:', error)
    return apiError(
      'CREATE_COURSE_DEFAULT_FAILED',
      error instanceof Error ? error.message : 'Error al crear curso predeterminado',
      500,
    )
  }
}

export const POST = withZodBody(createCourseDefaultRuleSchema, handlePost)
