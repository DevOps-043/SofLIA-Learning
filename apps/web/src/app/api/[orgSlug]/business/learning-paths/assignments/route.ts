import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  assignLearningPathSchema,
  type AssignLearningPathBody,
} from '../../_schemas'

const assignmentIdSchema = z.string().uuid('AssignmentId invalido')

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

async function handlePost(
  _request: NextRequest,
  body: AssignLearningPathBody,
  { params }: RouteParams,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
    }

    if (!auth.isOrgAdmin) {
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para asignar rutas dentro de esta organizacion',
        403,
      )
    }

    const learningPath = await AdminLearningPathsService.getLearningPathById(body.learningPathId)

    if (!learningPath || !learningPath.is_active) {
      return apiError(
        'LEARNING_PATH_NOT_AVAILABLE',
        'La ruta de aprendizaje no esta disponible',
        404,
      )
    }

    if (body.target) {
      const applyResult = await LearningPathDefaultsService.assignLearningPathToTarget({
        organizationId: auth.organizationId,
        learningPathId: body.learningPathId,
        target: {
          type: body.target.type,
          nodeIds: body.target.nodeIds,
          includeDescendants: body.target.includeDescendants ?? true,
        },
        assignedBy: auth.userId,
      })

      return NextResponse.json({
        success: true,
        applyResult,
        assignedCount: applyResult.assigned + applyResult.reactivated,
      })
    }

    const uniqueUserIds = Array.from(new Set(body.userIds ?? []))
    const supabase = await createClient()
    const { data: activeMembers, error: membershipError } = await supabase
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .in('user_id', uniqueUserIds)

    if (membershipError) {
      logger.error(
        'Error validating organization members for learning path assignment:',
        membershipError,
      )
      return apiError(
        'VALIDATE_MEMBERS_FAILED',
        'No se pudieron validar los usuarios seleccionados',
        500,
      )
    }

    if ((activeMembers || []).length !== uniqueUserIds.length) {
      return apiError(
        'INVALID_ORGANIZATION_USERS',
        'Algunos usuarios no pertenecen a tu organizacion o no estan activos',
        400,
      )
    }

    const assignments = []

    for (const userId of uniqueUserIds) {
      const assignment = await AdminLearningPathsService.assignToUser(
        auth.organizationId,
        userId,
        body.learningPathId,
        auth.userId,
      )

      assignments.push(assignment)
    }

    return NextResponse.json({
      success: true,
      assignments,
      assignedCount: assignments.length,
    })
  } catch (error) {
    logger.error('Error assigning learning path from business panel:', error)
    return apiError(
      'ASSIGN_LEARNING_PATH_FAILED',
      error instanceof Error ? error.message : 'Error al asignar la ruta de aprendizaje',
      500,
    )
  }
}

export const POST = withZodBody(assignLearningPathSchema, handlePost)

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizacion asignada' },
        { status: 403 },
      )
    }

    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para revocar rutas dentro de esta organizacion',
        },
        { status: 403 },
      )
    }

    const assignmentId = request.nextUrl.searchParams.get('assignmentId')
    const assignmentIdResult = assignmentIdSchema.safeParse(assignmentId)

    if (!assignmentIdResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: assignmentIdResult.error.errors[0]?.message || 'AssignmentId invalido',
        },
        { status: 400 },
      )
    }

    await AdminLearningPathsService.revokeFromUser(
      auth.organizationId,
      assignmentIdResult.data,
    )

    // Invalidate all server-rendered pages under this org so the affected
    // user sees their updated LP / course access immediately instead of
    // getting a stale cached response.
    revalidatePath(`/${orgSlug}`, 'layout')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error revoking learning path assignment from business panel:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al revocar la ruta de aprendizaje',
      },
      { status: 500 },
    )
  }
}
