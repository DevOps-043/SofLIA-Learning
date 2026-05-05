import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface AssignedUser {
  user_id: string
  source: 'direct' | 'team'
  team_name?: string
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

    // 2. Obtener equipos de la organización
    const { data: orgTeams, error: teamsError } = await supabase
      .from('work_teams')
      .select('team_id, name')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    logger.info(`📋 Org teams found: ${orgTeams?.length || 0}`)

    if (teamsError) {
      logger.error('Error fetching org teams:', teamsError)
    }

    if (!teamsError && orgTeams && orgTeams.length > 0) {
      const orgTeamIds = orgTeams.map((t: { team_id: string }) => t.team_id)
      const teamNamesMap = new Map<string, string>(orgTeams.map((t: { team_id: string, name: string }) => [t.team_id, t.name]))

      logger.info(`📋 Checking team course assignments for teams: ${orgTeamIds.join(', ')}`)

      // Obtener equipos que tienen el curso asignado
      const { data: teamCourseAssignments, error: teamCourseError } = await supabase
        .from('work_team_course_assignments')
        .select('team_id')
        .eq('course_id', courseId)
        .in('team_id', orgTeamIds)

      if (teamCourseError) {
        logger.error('Error fetching team course assignments:', teamCourseError)
      }

      logger.info(`📋 Team course assignments found: ${teamCourseAssignments?.length || 0}`)

      if (!teamCourseError && teamCourseAssignments && teamCourseAssignments.length > 0) {
        const assignedTeamIds = teamCourseAssignments.map((a: { team_id: string }) => a.team_id)

        logger.info(`📋 Teams with course assigned: ${assignedTeamIds.join(', ')}`)

        // Obtener miembros activos de esos equipos
        const { data: teamMembers, error: membersError } = await supabase
          .from('work_team_members')
          .select('user_id, team_id')
          .in('team_id', assignedTeamIds)
          .eq('status', 'active')

        if (membersError) {
          logger.error('Error fetching team members:', membersError)
        }

        logger.info(`📋 Team members found: ${teamMembers?.length || 0}`)

        if (!membersError && teamMembers) {
          teamMembers.forEach((m: { user_id: string, team_id: string }) => {
            // Solo agregar si no tiene asignación directa (la directa tiene prioridad)
            if (!assignedUsersMap.has(m.user_id)) {
              const teamName = teamNamesMap.get(m.team_id)
              logger.info(`👤 Adding user ${m.user_id} from team ${teamName}`)
              assignedUsersMap.set(m.user_id, {
                user_id: m.user_id,
                source: 'team',
                team_name: teamName
              })
            }
          })
        }
      }
    }

    const assignedUsers = Array.from(assignedUsersMap.values())
    const userIds = assignedUsers.map(u => u.user_id)

    logger.info(`✅ Total users with course ${courseId} assigned: ${userIds.length} (direct + team)`)
    logger.info(`✅ User IDs: ${userIds.join(', ')}`)

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
