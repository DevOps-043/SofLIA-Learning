import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface AssignedUser {
  user_id: string
  source: 'direct'
}

/**
 * GET /api/business/courses/[id]/assigned-users
 * Obtiene los IDs de usuarios que ya tienen el curso asignado
 * Incluye:
 * - Usuarios con asignación directa (organization_course_assignments)
 * - Usuarios que pertenecen a equipos con el curso asignado (work_team_course_assignments + work_team_members)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    // Usar organizationId de auth (viene de requireBusiness)
    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const { id: courseId } = await params
    const supabase = await createClient()
    const organizationId = auth.organizationId
    const assignedUsersMap = new Map<string, AssignedUser>()

    logger.info(`🔍 [assigned-users] Checking course ${courseId} for org ${organizationId}`)

    // 1. Obtener usuarios con asignación directa
    const { data: directAssignments, error: directError } = await supabase
      .from('organization_course_assignments')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .in('status', ['assigned', 'in_progress'])

    if (directError) {
      logger.error('Error fetching direct assignments:', directError)
    } else {
      logger.info(`📋 Direct assignments found: ${directAssignments?.length || 0}`)
        ; (directAssignments || []).forEach((a: { user_id: string }) => {
          assignedUsersMap.set(a.user_id, { user_id: a.user_id, source: 'direct' })
        })
    }

    // La asignación por "equipo de trabajo" (tablas work_team_*) se eliminó:
    // esas tablas ya no existen. La asignación llega por asignación directa.

    const assignedUsers = Array.from(assignedUsersMap.values())
    const userIds = assignedUsers.map(u => u.user_id)

    logger.info(`✅ Total users with course ${courseId} assigned: ${userIds.length}`)

    return NextResponse.json({
      success: true,
      user_ids: userIds,
      assigned_users: assignedUsers
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/courses/[id]/assigned-users:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      user_ids: [],
      assigned_users: []
    }, { status: 500 })
  }
}
