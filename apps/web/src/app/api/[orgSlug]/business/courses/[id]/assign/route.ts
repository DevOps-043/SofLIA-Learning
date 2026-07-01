import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'
import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { CourseDefaultsService } from '@/features/courses/services/course-defaults.server'
import {
  courseAssignmentCreateSchema,
  courseAssignmentDeleteSchema,
  type CourseAssignmentCreateBody,
  type CourseAssignmentDeleteBody,
} from '../../../_schemas'

type RouteContext = {
  params: Promise<{ orgSlug: string; id: string }>
}

/**
 * DELETE /api/[orgSlug]/business/courses/[id]/assign
 * Revoca asignaciones directas de un curso para los usuarios indicados.
 */
async function handleDelete(
  _request: NextRequest,
  body: CourseAssignmentDeleteBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, id: courseId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
    }

    const supabase = await createClient()

    const { error: deleteError, count } = await supabase
      .from('organization_course_assignments')
      .delete({ count: 'exact' })
      .eq('organization_id', auth.organizationId)
      .eq('course_id', courseId)
      .in('user_id', body.user_ids)

    if (deleteError) {
      logger.error('Error revoking course assignments:', deleteError)
      return apiError(
        'REVOKE_COURSE_ASSIGNMENTS_FAILED',
        'Error al revocar las asignaciones',
        500,
      )
    }

    logger.info(`Revoked ${count} direct course assignment(s) for course ${courseId}`)

    return NextResponse.json({
      success: true,
      message: `Se revocaron ${count ?? 0} asignacion(es) directa(s)`,
      revoked_count: count ?? 0,
    })
  } catch (error) {
    logger.error('Error in DELETE /api/[orgSlug]/business/courses/[id]/assign:', error)
    return apiError('REVOKE_COURSE_ASSIGNMENTS_FAILED', 'Error interno del servidor', 500)
  }
}

/**
 * POST /api/[orgSlug]/business/courses/[id]/assign
 * Asigna un curso a usuarios de la organizacion.
 */
async function handlePost(
  _request: NextRequest,
  body: CourseAssignmentCreateBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, id: courseId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
    }

    const organizationId = auth.organizationId

    const hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id, organizationId)
    if (!hasSubscription) {
      return apiError(
        'SUBSCRIPTION_REQUIRED',
        'Se requiere una membresia activa (Team/Enterprise) para asignar cursos',
        403,
      )
    }

    const { data: orgPurchase } = await supabase
      .from('organization_course_purchases')
      .select('purchase_id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .eq('access_status', 'active')
      .maybeSingle()

    if (!orgPurchase) {
      return apiError(
        'COURSE_PURCHASE_REQUIRED',
        'Tu organizacion debe adquirir el curso primero antes de poder asignarlo a usuarios',
        403,
      )
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      logger.error('Error fetching course:', courseError)
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado', 404)
    }

    const { user_ids, due_date, start_date, approach, message } = body

    // Resolve user IDs: from explicit list or from bulk target (all/node)
    let resolvedUserIds: string[]

    if (body.target) {
      try {
        const lpTarget =
          body.target.type === 'all'
            ? ({ type: 'all' } as const)
            : ({ type: 'node', nodeIds: body.target.nodeIds ?? [], includeDescendants: body.target.includeDescendants ?? true } as const)
        resolvedUserIds = await LearningPathDefaultsService.resolveTargetUserIds(organizationId, lpTarget)
      } catch (targetError) {
        logger.error('Error resolving target users for course assignment:', targetError)
        return apiError(
          'TARGET_RESOLUTION_FAILED',
          targetError instanceof Error ? targetError.message : 'Error al resolver usuarios del destino',
          400,
        )
      }

      if (resolvedUserIds.length === 0) {
        return apiError('NO_USERS_FOUND', 'No se encontraron usuarios activos para este destino', 400)
      }
    } else {
      const explicitUserIds = user_ids ?? []
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('organization_users')
        .select('user_id, organization_id, status')
        .in('user_id', explicitUserIds)
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (orgUsersError) {
        logger.error('Error validating organization users:', orgUsersError)
        return apiError('VALIDATE_USERS_FAILED', 'Error al validar usuarios', 500)
      }

      if (!orgUsers || orgUsers.length !== explicitUserIds.length) {
        return apiError(
          'INVALID_ORGANIZATION_USERS',
          'Algunos usuarios no pertenecen a tu organizacion o no estan activos',
          400,
        )
      }

      resolvedUserIds = explicitUserIds
    }

    if (start_date && due_date) {
      const startDateObj = new Date(start_date)
      const dueDateObj = new Date(due_date)

      if (startDateObj > dueDateObj) {
        return apiError(
          'INVALID_DATE_RANGE',
          'La fecha de inicio no puede ser posterior a la fecha limite',
          400,
        )
      }
    }

    const assignmentMessage = typeof message === 'string' && message.trim()
      ? message.trim()
      : null

    let assignResult
    try {
      assignResult = await CourseDefaultsService.assignCourseToUsers({
        organizationId,
        courseId,
        userIds: resolvedUserIds,
        assignedBy: currentUser.id,
        assignmentSource: 'bulk',
        dueDate: due_date || null,
        startDate: start_date || null,
        approach: approach || null,
        message: assignmentMessage,
      })
    } catch (assignError) {
      logger.error('Error creating assignments:', assignError)
      return apiError('ASSIGN_COURSE_FAILED', 'Error al asignar el curso', 500)
    }

    if (assignResult.assigned === 0) {
      return apiError(
        'COURSE_ALREADY_ASSIGNED',
        'Todos los usuarios seleccionados ya tienen este curso asignado',
        400,
      )
    }

    return NextResponse.json({
      success: true,
      message: `Curso asignado exitosamente a ${assignResult.assigned} usuario(s)`,
      data: {
        course_id: courseId,
        course_title: course.title,
        assigned_count: assignResult.assigned,
        already_assigned_count: assignResult.existing,
        assignments: assignResult.createdAssignments.map((assignment) => ({
          assignment_id: assignment.id,
          user_id: assignment.user_id,
        })),
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/courses/[id]/assign:', error)
    return apiError('ASSIGN_COURSE_FAILED', 'Error interno del servidor', 500)
  }
}

export const DELETE = withZodBody(courseAssignmentDeleteSchema, handleDelete)
export const POST = withZodBody(courseAssignmentCreateSchema, handlePost)
