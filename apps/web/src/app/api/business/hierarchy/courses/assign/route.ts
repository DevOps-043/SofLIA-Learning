import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'

interface AssignCoursesRequest {
  entity_id: string
  course_ids: string[]
  start_date?: string | null
  due_date?: string | null
  approach?: string | null
  message?: string | null
}

interface HierarchyNodeRow {
  id: string
  name: string
  type: string
}

interface NodeUserRow {
  user_id: string
}

interface CoursePurchaseRow {
  course_id: string
}

interface CourseTitleRow {
  title: string | null
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

/**
 * POST /api/business/hierarchy/courses/assign
 * Asigna cursos a todos los usuarios de una entidad de jerarquía (región, zona o equipo)
 * Requiere: membresía activa Y que la organización haya adquirido los cursos primero
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const organizationId = auth.organizationId

    // Validar que la organización tenga membresía activa
    const hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id, organizationId)
    if (!hasSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una membresía activa (Team/Enterprise) para asignar cursos'
      }, { status: 403 })
    }

    const body: AssignCoursesRequest = await request.json()
    const { entity_id, course_ids, start_date, due_date, approach, message } = body

    // entity_type es opcional/ignorado ya que usamos nodos unificados, pero si viene lo validamos básico
    // Lo importane es entity_id que ahora es el NODE ID.

    // Validar parámetros
    if (!entity_id || !course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere entity_id (node_id) y course_ids (array no vacío)'
      }, { status: 400 })
    }

    // Validar UUIDs
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entity_id)) {
      return NextResponse.json({
        success: false,
        error: 'entity_id debe ser un UUID válido (ID del nodo)'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verificar que el NODO existe y pertenece a la organización
    const { data: node, error: nodeError } = await supabase
      .from('organization_nodes')
      .select('id, name, type')
      .eq('id', entity_id)
      .eq('organization_id', organizationId)
      .single()

    if (nodeError || !node) {
      logger.error(`Error validando nodo ${entity_id}:`, nodeError)
      return NextResponse.json({
        success: false,
        error: 'Nodo no encontrado o no pertenece a tu organización'
      }, { status: 404 })
    }

    // 2. Obtener usuarios DIRECTOS del nodo (Single-Level Scope)
    // Usamos organization_node_users
    const { data: nodeUsers, error: usersError } = await supabase
      .from('organization_node_users')
      .select('user_id')
      .eq('node_id', entity_id)

    if (usersError) {
      logger.error('Error obteniendo usuarios del nodo:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener usuarios del nodo'
      }, { status: 500 })
    }

    if (!nodeUsers || nodeUsers.length === 0) {
      // Permitimos asignar el curso AL NODO aunque no tenga usuarios aun?
      // La lógica actual "push" requiere usuarios.
      // Pero organization_node_courses es persistente.
      // Vamos a permitirlo, pero avisando.
    }

    const user_ids = ((nodeUsers || []) as NodeUserRow[]).map((user) => user.user_id)

    // 3. Validar que la organización haya adquirido los cursos
    const { data: orgPurchases, error: purchaseError } = await supabase
      .from('organization_course_purchases')
      .select('course_id')
      .eq('organization_id', organizationId)
      .in('course_id', course_ids)
      .eq('access_status', 'active')

    if (purchaseError) {
      return NextResponse.json({
        success: false,
        error: 'Error al validar cursos adquiridos'
      }, { status: 500 })
    }

    const purchasedCourseIds = ((orgPurchases || []) as CoursePurchaseRow[]).map((purchase) => purchase.course_id)
    const missingCourses = course_ids.filter((id: string) => !purchasedCourseIds.includes(id))

    if (missingCourses.length > 0) {
      logger.error(`[Assign] 403 Forbidden: Organization ${organizationId} has not purchased courses: ${missingCourses.join(', ')}`)
      logger.info(`[Assign] Purchased courses found: ${purchasedCourseIds.join(', ')}`)

      return NextResponse.json({
        success: false,
        error: `La organización no ha adquirido los siguientes cursos: ${missingCourses.join(', ')}`
      }, { status: 403 })
    }

    // Validar fechas
    if (start_date && due_date) {
      if (new Date(start_date) > new Date(due_date)) {
        return NextResponse.json({
          success: false,
          error: 'Fecha inicio mayor a fecha límite'
        }, { status: 400 })
      }
    }

    const results = []

    for (const courseId of course_ids) {
      // Obtener info curso
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single<CourseTitleRow>()
      const courseTitle = course?.title || 'Curso'

      // A. Crear registro en organization_node_courses
      // Esto define que "Este nodo tiene asignado este curso"
      const nodeAssignment: OrganizationNodeCourseUpsert = {
        node_id: entity_id,
        course_id: courseId,
        assigned_by: currentUser.id,
        status: 'active',
        assigned_at: new Date().toISOString(),
        due_date: due_date || null,
        message: message || null
      }

      const { error: nodeAssignError } = await supabase
        .from('organization_node_courses')
        .upsert(nodeAssignment, { onConflict: 'node_id, course_id' }) // Asumiendo que hay constraint, sino insert normal

      if (nodeAssignError) {
        logger.error(`Error guardando assignment en organization_node_courses:`, nodeAssignError)
        // No bloqueante critico, pero es la fuente de verdad.
      }

      // B. Crear enrollments individuales para los usuarios
      if (user_ids.length > 0) {
        const assignmentsToUpsert: OrganizationCourseAssignmentUpsert[] = user_ids.map((uid) => ({
          organization_id: organizationId,
          user_id: uid,
          course_id: courseId,
          assigned_by: currentUser.id,
          assigned_at: new Date().toISOString(),
          due_date: due_date || null,
          start_date: start_date || null,
          approach: approach || null,
          message: message || null,
          status: 'assigned',
          completion_percentage: 0
        }))

        // TODO: Esto escribe en organization_course_assignments (legacy pero usado por el LMS core?)
        // Si el LMS core usa user_course_enrollments como fuente de verdad, escribimos ahi.
        // El código legacy escribía en AMBOS: organization_course_assignments Y user_course_enrollments.
        // Mantendremos esa lógica para compatibilidad máxima.

        // 1. Organization Course Assignments (Tracking de negocio)
        await supabase
          .from('organization_course_assignments')
          .upsert(assignmentsToUpsert, { onConflict: 'organization_id, user_id, course_id' })

        // 2. User Course Enrollments (Acceso LMS)
        const enrollmentsToUpsert: UserCourseEnrollmentUpsert[] = user_ids.map((uid) => ({
          user_id: uid,
          course_id: courseId,
          organization_id: organizationId,
          enrollment_status: 'active',
          enrolled_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        }))

        // Upsert enrollments (preserve progress if exists using ignore/do nothing?)
        // Mejor usamos insert con onConflict do nothing para no borrar progreso
        await supabase
          .from('user_course_enrollments')
          .upsert(enrollmentsToUpsert, { onConflict: 'user_id, course_id', ignoreDuplicates: true })
      }

      results.push({
        course_id: courseId,
        course_title: courseTitle,
        success: true,
        message: `Asignado al nodo y a ${user_ids.length} usuarios`
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
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 })
  }
}
