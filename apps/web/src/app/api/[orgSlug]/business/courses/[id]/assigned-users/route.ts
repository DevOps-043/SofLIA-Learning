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
 * GET /api/[orgSlug]/business/courses/[id]/assigned-users
 * Obtiene los IDs de usuarios que ya tienen el curso asignado
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

    // 2. Obtener equipos de la organización
    const { data: orgTeams, error: teamsError } = await supabase
      .from('work_teams')
      .select('team_id, name')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    logger.info(`📋 Org teams found: ${orgTeams?.length || 0}`)

    if (!teamsError && orgTeams && orgTeams.length > 0) {
      const orgTeamIds = orgTeams.map((t: { team_id: string }) => t.team_id)
      const teamNamesMap = new Map<string, string>(orgTeams.map((t: { team_id: string, name: string }) => [t.team_id, t.name]))

      const { data: teamCourseAssignments, error: teamCourseError } = await supabase
        .from('work_team_course_assignments')
        .select('team_id')
        .eq('course_id', courseId)
        .in('team_id', orgTeamIds)

      if (!teamCourseError && teamCourseAssignments && teamCourseAssignments.length > 0) {
        const assignedTeamIds = teamCourseAssignments.map((a: { team_id: string }) => a.team_id)

        const { data: teamMembers, error: membersError } = await supabase
          .from('work_team_members')
          .select('user_id, team_id')
          .in('team_id', assignedTeamIds)
          .eq('status', 'active')

        if (!membersError && teamMembers) {
          teamMembers.forEach((m: { user_id: string, team_id: string }) => {
            if (!assignedUsersMap.has(m.user_id)) {
              const teamName = teamNamesMap.get(m.team_id)
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

    logger.info(`✅ Total users with course ${courseId} assigned: ${userIds.length}`)

    return NextResponse.json({
      success: true,
      user_ids: userIds,
      assigned_users: assignedUsers
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
