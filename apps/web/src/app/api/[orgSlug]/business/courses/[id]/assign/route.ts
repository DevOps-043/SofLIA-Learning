import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * POST /api/[orgSlug]/business/courses/[id]/assign
 * Asigna un curso a usuarios de la organización
 * Requiere: membresía activa Y que el usuario haya adquirido el curso primero
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id: courseId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    // Obtener usuario autenticado
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Obtener organizationId
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

    // Verificar que la organización haya adquirido el curso primero
    const { data: orgPurchase } = await supabase
      .from('organization_course_purchases')
      .select('purchase_id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .eq('access_status', 'active')
      .maybeSingle()

    if (!orgPurchase) {
      return NextResponse.json({
        success: false,
        error: 'Tu organización debe adquirir el curso primero antes de poder asignarlo a usuarios'
      }, { status: 403 })
    }

    // Verificar que el curso exista y esté activo
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      logger.error('Error fetching course:', courseError)
      return NextResponse.json({
        success: false,
        error: 'Curso no encontrado'
      }, { status: 404 })
    }

    // Parsear body de la request
    const body = await request.json()
    const { user_ids, due_date, start_date, approach, message } = body

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Debes seleccionar al menos un usuario'
      }, { status: 400 })
    }

    // Validar que todos los usuarios pertenezcan a la misma organización
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('user_id, organization_id, status')
      .in('user_id', user_ids)
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (orgUsersError) {
      logger.error('Error validating organization users:', orgUsersError)
      return NextResponse.json({
        success: false,
        error: 'Error al validar usuarios'
      }, { status: 500 })
    }

    if (!orgUsers || orgUsers.length !== user_ids.length) {
      return NextResponse.json({
        success: false,
        error: 'Algunos usuarios no pertenecen a tu organización o no están activos'
      }, { status: 400 })
    }

    // Validar que start_date <= due_date si ambos están presentes
    if (start_date && due_date) {
      const startDateObj = new Date(start_date)
      const dueDateObj = new Date(due_date)

      if (startDateObj > dueDateObj) {
        return NextResponse.json({
          success: false,
          error: 'La fecha de inicio no puede ser posterior a la fecha límite'
        }, { status: 400 })
      }
    }

    // Validar approach si está presente
    if (approach && !['fast', 'balanced', 'long', 'custom'].includes(approach)) {
      return NextResponse.json({
        success: false,
        error: 'Enfoque inválido. Debe ser: fast, balanced, long o custom'
      }, { status: 400 })
    }

    // Verificar que los usuarios no tengan ya el curso asignado
    const { data: existingAssignments } = await supabase
      .from('organization_course_assignments')
      .select('user_id')
      .eq('course_id', courseId)
      .in('user_id', user_ids)
      .in('status', ['assigned', 'in_progress'])

    const existingUserIds = existingAssignments?.map(a => a.user_id) || []
    const newUserIds = user_ids.filter((id: string) => !existingUserIds.includes(id))

    if (newUserIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Todos los usuarios seleccionados ya tienen este curso asignado'
      }, { status: 400 })
    }

    // Crear asignaciones para los usuarios que no tienen el curso
    const assignments = newUserIds.map((userId: string) => ({
      organization_id: organizationId,
      user_id: userId,
      course_id: courseId,
      assigned_by: currentUser.id,
      assigned_at: new Date().toISOString(),
      due_date: due_date || null,
      start_date: start_date || null,
      approach: approach || null,
      message: message && message.trim() ? message.trim() : null,
      status: 'assigned',
      completion_percentage: 0
    }))

    const { data: createdAssignments, error: assignError } = await supabase
      .from('organization_course_assignments')
      .insert(assignments)
      .select()

    if (assignError || !createdAssignments) {
      logger.error('Error creating assignments:', assignError)
      return NextResponse.json({
        success: false,
        error: 'Error al asignar el curso'
      }, { status: 500 })
    }

    // Crear enrollments para usuarios que no tengan uno
    for (const userId of newUserIds) {
      const { data: existingEnrollment } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (!existingEnrollment) {
        const { error: enrollError } = await supabase
          .from('user_course_enrollments')
          .insert({
            user_id: userId,
            course_id: courseId,
            enrollment_status: 'active',
            overall_progress_percentage: 0,
            enrolled_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          })

        if (enrollError) {
          logger.warn('Error creating enrollment:', enrollError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Curso asignado exitosamente a ${createdAssignments.length} usuario(s)`,
      data: {
        course_id: courseId,
        course_title: course.title,
        assigned_count: createdAssignments.length,
        already_assigned_count: existingUserIds.length,
        assignments: createdAssignments.map(a => ({
          assignment_id: a.id,
          user_id: a.user_id
        }))
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/courses/[id]/assign:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
