import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface AssignedUser {
  user_id: string
  source: 'direct' | 'learning_path'
  learning_path_title?: string
}

/**
 * GET /api/[orgSlug]/business/courses/[id]/assigned-users
 * Obtiene los IDs de usuarios que ya tienen el curso asignado
 * (directamente, a través de un equipo, o a través de un learning path)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id: courseId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

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
      ;(directAssignments || []).forEach((a: { user_id: string }) => {
        assignedUsersMap.set(a.user_id, { user_id: a.user_id, source: 'direct' })
      })
    }

    // (Se eliminó la asignación por "equipo de trabajo": las tablas work_team_*
    // ya no existen. La asignación a nivel de organización llega por asignación
    // directa o por learning path.)

    // 2. Obtener usuarios asignados a través de learning paths que contienen este curso
    try {
      // 3a. Buscar learning paths que contienen este curso
      const { data: pathItems, error: pathItemsError } = await supabase
        .from('learning_path_items')
        .select('learning_path_id')
        .eq('course_id', courseId)

      if (!pathItemsError && pathItems && pathItems.length > 0) {
        const learningPathIds = [...new Set(pathItems.map((item: { learning_path_id: string }) => item.learning_path_id))]

        // 3b. Obtener learning paths activos con sus títulos
        const { data: activePaths, error: activePathsError } = await supabase
          .from('learning_paths')
          .select('id, title')
          .in('id', learningPathIds)
          .eq('is_active', true)

        if (!activePathsError && activePaths && activePaths.length > 0) {
          const activePathIds = activePaths.map((p: { id: string }) => p.id)
          const pathTitleMap = new Map<string, string>(
            activePaths.map((p: { id: string; title: string }) => [p.id, p.title])
          )

          // 3c. Buscar asignaciones org-level de learning paths activos a esta org
          const { data: orgLpAssignments, error: orgLpError } = await supabase
            .from('organization_learning_path_assignments')
            .select('learning_path_id')
            .eq('organization_id', organizationId)
            .eq('status', 'active')
            .in('learning_path_id', activePathIds)

          // Si la org tiene algún learning path asignado con este curso,
          // todos los miembros de la org tienen acceso al curso
          if (!orgLpError && orgLpAssignments && orgLpAssignments.length > 0) {
            const { data: orgMembers, error: orgMembersError } = await supabase
              .from('organization_users')
              .select('user_id')
              .eq('organization_id', organizationId)
              .eq('status', 'active')

            if (!orgMembersError && orgMembers) {
              const firstAssignedPathId = orgLpAssignments[0].learning_path_id
              const lpTitle = pathTitleMap.get(firstAssignedPathId) || 'Ruta de aprendizaje'
              orgMembers.forEach((member: { user_id: string }) => {
                if (!assignedUsersMap.has(member.user_id)) {
                  assignedUsersMap.set(member.user_id, {
                    user_id: member.user_id,
                    source: 'learning_path',
                    learning_path_title: lpTitle,
                  })
                }
              })
            }
          }

          // 3d. Buscar asignaciones user-level de learning paths con este curso
          const { data: userLpAssignments, error: userLpError } = await supabase
            .from('user_learning_path_assignments')
            .select('user_id, learning_path_id')
            .eq('organization_id', organizationId)
            .eq('status', 'assigned')
            .in('learning_path_id', activePathIds)

          if (!userLpError && userLpAssignments) {
            userLpAssignments.forEach((assignment: { user_id: string; learning_path_id: string }) => {
              if (!assignedUsersMap.has(assignment.user_id)) {
                const lpTitle = pathTitleMap.get(assignment.learning_path_id) || 'Ruta de aprendizaje'
                assignedUsersMap.set(assignment.user_id, {
                  user_id: assignment.user_id,
                  source: 'learning_path',
                  learning_path_title: lpTitle,
                })
              }
            })
          }
        }
      }
    } catch (lpError) {
      // Learning path tables might not exist in all environments — log and continue
      logger.error('Error checking learning path course assignments:', lpError)
    }

    const assignedUsers = Array.from(assignedUsersMap.values())
    const userIds = assignedUsers.map(u => u.user_id)

    logger.info(`✅ Total users with course ${courseId} assigned: ${userIds.length} (direct: ${assignedUsers.filter(u => u.source === 'direct').length}, learning_path: ${assignedUsers.filter(u => u.source === 'learning_path').length})`)

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
    logger.error('💥 Error in /api/[orgSlug]/business/courses/[id]/assigned-users:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      user_ids: [],
      assigned_users: []
    }, { status: 500 })
  }
}
