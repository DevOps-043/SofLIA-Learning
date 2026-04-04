import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'

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
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const organizationId = auth.organizationId;
    const userId = auth.userId;

    // Validar membresía
    const hasSubscription = await SubscriptionService.hasActiveSubscription(userId, organizationId)
    if (!hasSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una membresía activa (Team/Enterprise) para asignar cursos'
      }, { status: 403 })
    }

    const body = await request.json()
    const { entity_id, course_ids, start_date, due_date, approach, message } = body

    if (!entity_id || !course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere entity_id (node_id) y course_ids (array no vacío)'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verificar nodo
    const { data: node, error: nodeError } = await supabase
      .from('organization_nodes')
      .select('id, name, type')
      .eq('id', entity_id)
      .eq('organization_id', organizationId)
      .single()

    if (nodeError || !node) {
      return NextResponse.json({
        success: false,
        error: 'Nodo no encontrado o no pertenece a tu organización'
      }, { status: 404 })
    }

    // 2. Obtener usuarios
    const { data: nodeUsers, error: usersError } = await supabase
      .from('organization_node_users')
      .select('user_id')
      .eq('node_id', entity_id)
      .returns<OrganizationNodeUserRow[]>()

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: 'Error al obtener usuarios del nodo'
      }, { status: 500 })
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
      return NextResponse.json({
        success: false,
        error: 'Error al validar cursos adquiridos'
      }, { status: 500 })
    }

    const purchasedCourseIds = orgPurchases?.map((purchase) => purchase.course_id) || []
    const missingCourses = course_ids.filter((id: string) => !purchasedCourseIds.includes(id))

    if (missingCourses.length > 0) {
      return NextResponse.json({
        success: false,
        error: `La organización no ha adquirido algunos de los cursos especificados`
      }, { status: 403 })
    }

    const results = []

    for (const courseId of course_ids) {
      const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single()
      const courseTitle = course?.title || 'Curso'

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

        const enrollmentsToUpsert = user_ids.map((uid: string) => ({
          user_id: uid,
          course_id: courseId,
          organization_id: organizationId,
          enrollment_status: 'active',
          enrolled_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        }))

        await supabase
          .from('user_course_enrollments')
          .upsert(enrollmentsToUpsert, { onConflict: 'user_id, course_id', ignoreDuplicates: true })
      }

      results.push({
        course_id: courseId,
        course_title: courseTitle,
        success: true
      })
    }

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
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 })
  }
}
