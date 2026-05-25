import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'
import {
  teamCreateSchema,
  type TeamCreateBody,
} from '../_schemas'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/teams
 * Lista todos los equipos de la organizacion especificada
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json({
        success: false,
        error: 'Slug de organizacion requerido',
      }, { status: 400 })
    }

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const { data: teams, error: teamsError } = await supabase
      .from('work_teams')
      .select(`
        team_id,
        organization_id,
        name,
        description,
        team_leader_id,
        created_by,
        course_id,
        status,
        metadata,
        image_url,
        created_at,
        updated_at
      `)
      .eq('organization_id', auth.organizationId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (teamsError) {
      logger.error('Error fetching teams:', teamsError)
      if (teamsError.code === '42P01' || teamsError.message?.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Las tablas de equipos no existen en la base de datos.',
        }, { status: 500 })
      }
      return NextResponse.json({
        success: false,
        error: teamsError.message || 'Error al obtener equipos',
      }, { status: 500 })
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: true,
        teams: [],
      }, {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      })
    }

    const teamIds = teams.map((team) => team.team_id)
    const leaderIds = [...new Set(teams.map((team) => team.team_leader_id).filter(Boolean))]
    const courseIds = [...new Set(teams.map((team) => team.course_id).filter(Boolean))]

    const [
      { data: members, error: membersError },
      { data: leaders },
      { data: courses },
    ] = await Promise.all([
      supabase
        .from('work_team_members')
        .select('team_id, status')
        .in('team_id', teamIds),

      leaderIds.length > 0
        ? supabase
            .from('users')
            .select('id, display_name, first_name, last_name, email, profile_picture_url')
            .in('id', leaderIds)
        : Promise.resolve({ data: [] }),

      courseIds.length > 0
        ? supabase
            .from('courses')
            .select('id, title, thumbnail_url')
            .in('id', courseIds)
        : Promise.resolve({ data: [] }),
    ])

    if (membersError) {
      logger.error('Error fetching members:', membersError)
    }

    const memberCounts: Record<string, { total: number; active: number }> = {}
    teamIds.forEach((teamId) => {
      const teamMembers = (members || []).filter((member) => member.team_id === teamId)
      memberCounts[teamId] = {
        total: teamMembers.length,
        active: teamMembers.filter((member) => member.status === 'active').length,
      }
    })

    const leadersMap = new Map((leaders || []).map((leader) => [
      leader.id,
      {
        id: leader.id,
        name: leader.display_name || `${leader.first_name || ''} ${leader.last_name || ''}`.trim() || leader.email,
        email: leader.email,
        profile_picture_url: leader.profile_picture_url,
      },
    ]))

    const coursesMap = new Map((courses || []).map((course) => [
      course.id,
      {
        id: course.id,
        title: course.title,
        thumbnail_url: course.thumbnail_url,
      },
    ]))

    const enrichedTeams = teams.map((team) => ({
      ...team,
      team_leader: team.team_leader_id ? leadersMap.get(team.team_leader_id) || null : null,
      course: team.course_id ? coursesMap.get(team.course_id) || null : null,
      member_count: memberCounts[team.team_id]?.total || 0,
      active_member_count: memberCounts[team.team_id]?.active || 0,
    }))

    return NextResponse.json({
      success: true,
      teams: enrichedTeams,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/teams GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}

/**
 * POST /api/[orgSlug]/business/teams
 * Crea un nuevo equipo en la organizacion especificada
 */
async function handlePost(
  _request: NextRequest,
  body: TeamCreateBody,
  context: RouteContext,
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return apiError('ORG_SLUG_REQUIRED', 'Slug de organizacion requerido', 400)
    }

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const { name, description, team_leader_id, course_id, member_ids, metadata, image_url } = body
    const supabase = await createClient()

    const { data: team, error: teamError } = await supabase
      .from('work_teams')
      .insert({
        organization_id: auth.organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        team_leader_id: team_leader_id || null,
        created_by: currentUser.id,
        course_id: course_id || null,
        status: 'active',
        metadata: metadata || {},
        image_url: image_url || null,
      })
      .select()
      .single()

    if (teamError || !team) {
      logger.error('Error creating team:', teamError)
      return apiError('CREATE_TEAM_FAILED', 'Error al crear el equipo', 500)
    }

    if (member_ids && member_ids.length > 0) {
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', auth.organizationId)
        .in('user_id', member_ids)
        .eq('status', 'active')

      if (orgUsersError) {
        logger.error('Error validating organization users:', orgUsersError)
      } else if (orgUsers && orgUsers.length > 0) {
        const validUserIds = orgUsers.map((user) => user.user_id)

        const allMemberIds = team_leader_id && !validUserIds.includes(team_leader_id)
          ? [...validUserIds, team_leader_id]
          : validUserIds

        const membersToInsert = allMemberIds.map((userId) => ({
          team_id: team.team_id,
          user_id: userId,
          role: userId === team_leader_id ? 'leader' : 'member',
          status: 'active',
        }))

        const { error: membersError } = await supabase
          .from('work_team_members')
          .insert(membersToInsert)

        if (membersError) {
          logger.error('Error adding team members:', membersError)
        }
      }
    } else if (team_leader_id) {
      const { error: leaderError } = await supabase
        .from('work_team_members')
        .insert({
          team_id: team.team_id,
          user_id: team_leader_id,
          role: 'leader',
          status: 'active',
        })

      if (leaderError) {
        logger.error('Error adding team leader as member:', leaderError)
      }
    }

    const { data: fullTeam, error: fullTeamError } = await supabase
      .from('work_teams')
      .select(`
        team_id,
        organization_id,
        name,
        description,
        team_leader_id,
        created_by,
        course_id,
        status,
        metadata,
        image_url,
        created_at,
        updated_at
      `)
      .eq('team_id', team.team_id)
      .single()

    if (fullTeamError || !fullTeam) {
      logger.error('Error fetching created team:', fullTeamError)
      return apiError(
        'FETCH_CREATED_TEAM_FAILED',
        'Equipo creado pero error al obtener detalles',
        500,
      )
    }

    return NextResponse.json({
      success: true,
      team: fullTeam,
      message: 'Equipo creado exitosamente',
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/teams POST:', error)
    return apiError('CREATE_TEAM_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(teamCreateSchema, handlePost)
