import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import {
  assignCoursesSchema,
  type AssignCoursesBody,
} from '@/app/api/business/hierarchy/_schemas'

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

interface OrganizationNodeUserRow {
  user_id: string
}

interface OrganizationCoursePurchaseRow {
  course_id: string
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
}

/**
 * POST /api/[orgSlug]/business/hierarchy/courses/assign
 */
async function handlePost(
  _request: NextRequest,
  body: AssignCoursesBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403)
    }

    const organizationId = auth.organizationId;
    const userId = auth.userId;

    // Validar membresía
    const hasSubscription = await SubscriptionService.hasActiveSubscription(userId, organizationId)
    if (!hasSubscription) {
      return apiError(
        'NO_ACTIVE_SUBSCRIPTION',
        'Se requiere una membresía activa (Team/Enterprise) para asignar cursos',
        403,
      )
    }

    const { entity_id, course_ids, start_date, due_date, approach, message } = body

    const supabase = await createClient()

    // 1. Verificar nodo
    const { data: node, error: nodeError } = await supabase
      .from('organization_nodes')
      .select('id, name, type')
      .eq('id', entity_id)
      .eq('organization_id', organizationId)
      .single()

    if (nodeError || !node) {
      return apiError(
        'NODE_NOT_FOUND',
        'Nodo no encontrado o no pertenece a tu organización',
        404,
      )
    }

    // 2. Obtener usuarios
    const { data: nodeUsers, error: usersError } = await supabase
      .from('organization_node_users')
      .select('user_id')
      .eq('node_id', entity_id)
      .returns<OrganizationNodeUserRow[]>()

    if (usersError) {
      return apiError(
        'NODE_USERS_FETCH_FAILED',
        'Error al obtener usuarios del nodo',
        500,
      )
    }

    const user_ids = nodeUsers?.map((user) => user.user_id) || []

    // 3. Validar compras
    const { data: orgPurchases, error: purchaseError } = await supabase
      .from('organization_course_purchases')
      .select('course_id')
      .eq('organization_id', organizationId)
      .in('course_id', course_ids)
      .eq('access_status', 'active')
      .returns<OrganizationCoursePurchaseRow[]>()

    if (purchaseError) {
      return apiError(
        'COURSE_VALIDATION_FAILED',
        'Error al validar cursos adquiridos',
        500,
      )
    }

    const purchasedCourseIds = orgPurchases?.map((purchase) => purchase.course_id) || []
    const missingCourses = course_ids.filter((id: string) => !purchasedCourseIds.includes(id))

    if (missingCourses.length > 0) {
      return apiError(
        'COURSES_NOT_PURCHASED',
        'La organización no ha adquirido algunos de los cursos especificados',
        403,
      )
    }

    // Batch fetch course titles instead of N+1 loop
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', course_ids)
    const courseTitleMap = new Map(
      (coursesData || []).map((c: { id: string; title: string }) => [c.id, c.title])
    )

    const results = await Promise.all(
      course_ids.map(async (courseId: string) => {
        const courseTitle = courseTitleMap.get(courseId) || 'Curso'

        await supabase
          .from('organization_node_courses')
          .upsert({
            node_id: entity_id,
            course_id: courseId,
            assigned_by: userId,
            status: 'active',
            assigned_at: new Date().toISOString(),
            due_date: due_date || null,
            message: message || null
          }, { onConflict: 'node_id, course_id' })

        if (user_ids.length > 0) {
          const assignmentsToUpsert = user_ids.map((uid: string) => ({
            organization_id: organizationId,
            user_id: uid,
            course_id: courseId,
            assigned_by: userId,
            assigned_at: new Date().toISOString(),
            due_date: due_date || null,
            start_date: start_date || null,
            approach: approach || null,
            message: message || null,
            status: 'assigned',
            completion_percentage: 0
          }))

          await supabase
            .from('organization_course_assignments')
            .upsert(assignmentsToUpsert, { onConflict: 'organization_id, user_id, course_id' })

          const { data: existingEnrollments, error: existingEnrollmentsError } = await supabase
            .from('user_course_enrollments')
            .select('user_id')
            .eq('course_id', courseId)
            .eq('organization_id', organizationId)
            .in('user_id', user_ids)

          if (existingEnrollmentsError) {
            logger.warn('Error checking existing scoped enrollments:', existingEnrollmentsError)
          }

          const enrolledUserIds = new Set(
            (existingEnrollments || []).map((enrollment: { user_id: string }) => enrollment.user_id),
          )
          const enrollmentsToCreate = user_ids
            .filter((uid: string) => !enrolledUserIds.has(uid))
            .map((uid: string) => ({
              user_id: uid,
              course_id: courseId,
              organization_id: organizationId,
              enrollment_status: 'active',
              enrolled_at: new Date().toISOString(),
              last_accessed_at: new Date().toISOString()
            }))

          if (enrollmentsToCreate.length > 0) {
            const { error: enrollmentError } = await supabase
              .from('user_course_enrollments')
              .insert(enrollmentsToCreate)

            if (enrollmentError) {
              logger.warn('Error creating scoped enrollments:', enrollmentError)
            }
          }
        }

        return { course_id: courseId, course_title: courseTitle, success: true }
      })
    )

    return NextResponse.json({
      success: true,
      message: `Cursos asignados correctamente al nodo ${node.name}`,
      data: {
        entity_id,
        entity_name: node.name,
        total_users: user_ids.length,
        results
      }
    })

  } catch (error: unknown) {
    logger.error('Error en POST assign:', error)
    return apiError('ASSIGN_COURSES_FAILED', getErrorMessage(error), 500)
  }
}

export const POST = withZodBody(assignCoursesSchema, handlePost)
