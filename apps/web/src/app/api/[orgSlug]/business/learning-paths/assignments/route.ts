import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const userIdsSchema = z
  .array(z.string().uuid('UserId invalido'))
  .min(1, 'Selecciona al menos un usuario')

const assignLearningPathSchema = z.object({
  learningPathId: z.string().uuid('LearningPathId invalido'),
  userIds: z.array(z.string().uuid('UserId invalido')).optional(),
  target: z.object({
    type: z.enum(['all', 'node']),
    nodeIds: z.array(z.string().uuid('NodeId invalido')).optional(),
    includeDescendants: z.boolean().optional(),
  }).optional(),
}).refine(
  (value) => (value.userIds && value.userIds.length > 0) || Boolean(value.target),
  'Selecciona al menos un usuario o una audiencia',
).refine(
  (value) => value.target?.type !== 'node' || Boolean(value.target.nodeIds?.length),
  'Selecciona al menos un nodo',
)

const assignmentIdSchema = z.string().uuid('AssignmentId invalido')

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
          error: 'No tienes permisos para asignar rutas dentro de esta organizacion',
        },
        { status: 403 },
      )
    }

    const body = assignLearningPathSchema.parse(await request.json())
    const learningPath = await AdminLearningPathsService.getLearningPathById(body.learningPathId)

    if (!learningPath || !learningPath.is_active) {
      return NextResponse.json(
        { success: false, error: 'La ruta de aprendizaje no esta disponible' },
        { status: 404 },
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

    const uniqueUserIds = Array.from(new Set(userIdsSchema.parse(body.userIds)))
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
      return NextResponse.json(
        { success: false, error: 'No se pudieron validar los usuarios seleccionados' },
        { status: 500 },
      )
    }

    if ((activeMembers || []).length !== uniqueUserIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Algunos usuarios no pertenecen a tu organizacion o no estan activos',
        },
        { status: 400 },
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
    const isValidationError = error instanceof z.ZodError

    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'Solicitud invalida'
          : error instanceof Error
            ? error.message
            : 'Error al asignar la ruta de aprendizaje',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}

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
