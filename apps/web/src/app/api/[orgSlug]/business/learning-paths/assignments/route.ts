import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const assignLearningPathSchema = z.object({
  learningPathId: z.string().uuid('LearningPathId inválido'),
  userIds: z.array(z.string().uuid('UserId inválido')).min(1, 'Selecciona al menos un usuario'),
})

const assignmentIdSchema = z.string().uuid('AssignmentId inválido')

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
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 },
      )
    }

    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para asignar rutas dentro de esta organización',
        },
        { status: 403 },
      )
    }

    const body = assignLearningPathSchema.parse(await request.json())
    const learningPath = await AdminLearningPathsService.getLearningPathById(body.learningPathId)

    if (!learningPath || !learningPath.is_active) {
      return NextResponse.json(
        { success: false, error: 'La ruta de aprendizaje no está disponible' },
        { status: 404 },
      )
    }

    const uniqueUserIds = Array.from(new Set(body.userIds))
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
          error: 'Algunos usuarios no pertenecen a tu organización o no están activos',
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
          ? error.errors[0]?.message || 'Solicitud inválida'
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
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 },
      )
    }

    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para revocar rutas dentro de esta organización',
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
          error: assignmentIdResult.error.errors[0]?.message || 'AssignmentId inválido',
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
