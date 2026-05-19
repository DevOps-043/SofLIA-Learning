import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

import {
  assignCoursesSchema,
  type AssignCoursesBody,
} from '../../_schemas'

interface NodeUserRow {
  user_id: string
}

interface CoursePurchaseRow {
  course_id: string
}

interface OrganizationNodeCourseUpsert {
  node_id: string
  course_id: string
  assigned_by: string
  status: 'active'
  assigned_at: string
  due_date: string | null
  message: string | null
}

interface OrganizationCourseAssignmentUpsert {
  organization_id: string
  user_id: string
  course_id: string
  assigned_by: string
  assigned_at: string
  due_date: string | null
  start_date: string | null
  approach: string | null
  message: string | null
  status: 'assigned'
  completion_percentage: number
}

interface UserCourseEnrollmentUpsert {
  user_id: string
  course_id: string
  organization_id: string
  enrollment_status: 'active'
  enrolled_at: string
  last_accessed_at: string
}

async function handlePost(_request: NextRequest, body: AssignCoursesBody) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    if (!auth.organizationId) {
      return apiError(
        'NO_ORGANIZATION',
        'No tienes una organización asignada',
        403,
      )
    }

    const organizationId = auth.organizationId

    const hasSubscription = await SubscriptionService.hasActiveSubscription(
      currentUser.id,
      organizationId,
    )
    if (!hasSubscription) {
      return apiError(
        'NO_ACTIVE_SUBSCRIPTION',
        'Se requiere una membresía activa (Team/Enterprise) para asignar cursos',
        403,
      )
    }

    const { entity_id, course_ids, start_date, due_date, approach, message } = body

    if (start_date && due_date && new Date(start_date) > new Date(due_date)) {
      return apiError(
        'INVALID_DATE_RANGE',
        'Fecha inicio mayor a fecha límite',
        400,
      )
    }

    const supabase = await createClient()

    const { data: node, error: nodeError } = await supabase
      .from('organization_nodes')
      .select('id, name, type')
      .eq('id', entity_id)
      .eq('organization_id', organizationId)
      .single()

    if (nodeError || !node) {
      logger.error(`Error validando nodo ${entity_id}:`, nodeError)
      return apiError(
        'NODE_NOT_FOUND',
        'Nodo no encontrado o no pertenece a tu organización',
        404,
      )
    }

    const { data: nodeUsers, error: usersError } = await supabase
      .from('organization_node_users')
      .select('user_id')
      .eq('node_id', entity_id)

    if (usersError) {
      logger.error('Error obteniendo usuarios del nodo:', usersError)
      return apiError(
        'NODE_USERS_FETCH_FAILED',
        'Error al obtener usuarios del nodo',
        500,
      )
    }

    const user_ids = ((nodeUsers || []) as NodeUserRow[]).map((u) => u.user_id)

    const { data: orgPurchases, error: purchaseError } = await supabase
      .from('organization_course_purchases')
      .select('course_id')
      .eq('organization_id', organizationId)
      .in('course_id', course_ids)
      .eq('access_status', 'active')

    if (purchaseError) {
      return apiError(
        'COURSE_VALIDATION_FAILED',
        'Error al validar cursos adquiridos',
        500,
      )
    }

    const purchasedCourseIds = ((orgPurchases || []) as CoursePurchaseRow[]).map(
      (p) => p.course_id,
    )
    const missingCourses = course_ids.filter(
      (id) => !purchasedCourseIds.includes(id),
    )

    if (missingCourses.length > 0) {
      return apiError(
        'COURSES_NOT_PURCHASED',
        `La organización no ha adquirido los siguientes cursos: ${missingCourses.join(', ')}`,
        403,
      )
    }

    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', course_ids)
    const courseTitleMap = new Map(
      (coursesData || []).map((c: { id: string; title: string }) => [c.id, c.title]),
    )

    const results = []
    const nowISO = new Date().toISOString()

    for (const courseId of course_ids) {
      const courseTitle = courseTitleMap.get(courseId) || 'Curso'

      const nodeAssignment: OrganizationNodeCourseUpsert = {
        node_id: entity_id,
        course_id: courseId,
        assigned_by: currentUser.id,
        status: 'active',
        assigned_at: nowISO,
        due_date: due_date || null,
        message: message || null,
      }

      const { error: nodeAssignError } = await supabase
        .from('organization_node_courses')
        .upsert(nodeAssignment, { onConflict: 'node_id, course_id' })

      if (nodeAssignError) {
        logger.error(
          `Error guardando assignment en organization_node_courses:`,
          nodeAssignError,
        )
      }

      if (user_ids.length > 0) {
        const assignmentsToUpsert: OrganizationCourseAssignmentUpsert[] =
          user_ids.map((uid) => ({
            organization_id: organizationId,
            user_id: uid,
            course_id: courseId,
            assigned_by: currentUser.id,
            assigned_at: nowISO,
            due_date: due_date || null,
            start_date: start_date || null,
            approach: approach || null,
            message: message || null,
            status: 'assigned',
            completion_percentage: 0,
          }))

        await supabase
          .from('organization_course_assignments')
          .upsert(assignmentsToUpsert, {
            onConflict: 'organization_id, user_id, course_id',
          })

        const enrollmentsToUpsert: UserCourseEnrollmentUpsert[] = user_ids.map(
          (uid) => ({
            user_id: uid,
            course_id: courseId,
            organization_id: organizationId,
            enrollment_status: 'active',
            enrolled_at: nowISO,
            last_accessed_at: nowISO,
          }),
        )

        await supabase
          .from('user_course_enrollments')
          .upsert(enrollmentsToUpsert, {
            onConflict: 'user_id, course_id',
            ignoreDuplicates: true,
          })
      }

      results.push({
        course_id: courseId,
        course_title: courseTitle,
        success: true,
        message: `Asignado al nodo y a ${user_ids.length} usuarios`,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Cursos asignados correctamente al nodo ${node.name}`,
      data: {
        entity_id,
        entity_name: node.name,
        total_users: user_ids.length,
        results,
      },
    })
  } catch (error: unknown) {
    logger.error('Error en POST assign:', error)
    return apiError(
      'ASSIGN_COURSES_FAILED',
      error instanceof Error ? error.message : 'Error interno del servidor',
      500,
    )
  }
}

export const POST = withZodBody(assignCoursesSchema, handlePost)
