import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { cacheHeaders } from '@/lib/utils/cache-headers'

interface OrganizationUserStatsRow {
  status: 'active' | 'invited' | string
  joined_at: string | null
  created_at: string | null
}

interface BulkInviteLinkRow {
  current_uses: number | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    // 🚀 OPTIMIZACIÓN: Calcular fechas una sola vez
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 60)

    // 🚀 OPTIMIZACIÓN: Combinar 3 queries de organization_users en 1 sola query + filter client-side
    const [
      { data: orgUsers, error: usersError },
      { data: assignments, error: assignmentsError },
      { data: bulkLinks, error: linksError },
      { data: pendingInvitations, error: invError }
    ] = await Promise.all([
      supabase
        .from('organization_users')
        .select('status, joined_at, created_at')
        .eq('organization_id', organizationId)
        .in('status', ['active', 'invited'])
        .returns<OrganizationUserStatsRow[]>(),
      supabase
        .from('organization_course_assignments')
        .select('id, status, completion_percentage, assigned_at, completed_at')
        .eq('organization_id', organizationId),
      supabase
        .from('bulk_invite_links')
        .select('current_uses')
        .eq('organization_id', organizationId)
        .returns<BulkInviteLinkRow[]>(),
      supabase
        .from('user_invitations')
        .select('id, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
    ])

    if (usersError) logger.error('Error fetching organization users:', usersError)
    if (assignmentsError) logger.error('Error fetching course assignments:', assignmentsError)
    if (linksError) logger.error('Error fetching bulk invite links:', linksError)
    if (invError) logger.error('Error fetching pending invitations:', invError)

    // Filtrar usuarios activos e invitados
    const activeOrgUsers = orgUsers?.filter((user) => user.status === 'active') || []
    const invitedOrgUsers = orgUsers?.filter((user) => user.status === 'invited') || []
    
    const activeUsers = activeOrgUsers.length
    const invitedUsersCount = invitedOrgUsers.length + (pendingInvitations?.length || 0)

    const bulkLinkUsage = (bulkLinks || []).reduce(
      (sum, link) => sum + (link.current_uses || 0),
      0
    )

    // Calcular cambio de usuarios activos
    const recentActive = activeOrgUsers.filter(
      (user) => user.joined_at && new Date(user.joined_at) >= thirtyDaysAgo
    ).length
    const previousActive = activeOrgUsers.filter((user) => {
      if (!user.joined_at) return false
      const joinedAt = new Date(user.joined_at)
      return joinedAt >= previousPeriodStart && joinedAt < thirtyDaysAgo
    }).length

    const usersChange = previousActive > 0
      ? `${((recentActive - previousActive) / previousActive * 100).toFixed(0)}%`
      : recentActive > 0 ? '+100%' : '0%'
    const usersChangeType = recentActive >= previousActive ? 'positive' : 'negative'

    // Calcular cambio de usuarios invitados
    const recentInvited = invitedOrgUsers.filter(
      (user) => user.created_at && new Date(user.created_at) >= thirtyDaysAgo
    ).length
    const previousInvited = invitedOrgUsers.filter((user) => {
      if (!user.created_at) return false
      const createdAt = new Date(user.created_at)
      return createdAt >= previousPeriodStart && createdAt < thirtyDaysAgo
    }).length

    const invitedChange = previousInvited > 0
      ? `${((recentInvited - previousInvited) / previousInvited * 100).toFixed(0)}%`
      : recentInvited > 0 ? '+100%' : '0%'
    const invitedChangeType = recentInvited >= previousInvited ? 'positive' : 'negative'

    // 🚀 OPTIMIZACIÓN: Single-pass processing instead of 8+ filter calls
    let totalAssignments = 0
    let completedAssignments = 0
    let totalProgress = 0
    let recentAssignments = 0
    let previousAssignments = 0
    let recentCompleted = 0
    let previousCompleted = 0
    let recentTotalProgress = 0
    let previousTotalProgress = 0

    if (assignments) {
      for (const a of assignments) {
        totalAssignments++
        totalProgress += a.completion_percentage || 0
        if (a.status === 'completed') completedAssignments++

        const assignedAt = new Date(a.assigned_at)
        const completedAt = a.completed_at ? new Date(a.completed_at) : null

        if (assignedAt >= thirtyDaysAgo) {
          recentAssignments++
          recentTotalProgress += a.completion_percentage || 0
        } else if (assignedAt >= previousPeriodStart) {
          previousAssignments++
          previousTotalProgress += a.completion_percentage || 0
        }

        if (completedAt && completedAt >= thirtyDaysAgo) {
          recentCompleted++
        } else if (completedAt && completedAt >= previousPeriodStart) {
          previousCompleted++
        }
      }
    }

    const averageProgress = totalAssignments > 0 ? Math.round(totalProgress / totalAssignments) : 0
    const recentAvgProgress = recentAssignments > 0 ? Math.round(recentTotalProgress / recentAssignments) : 0
    const previousAvgProgress = previousAssignments > 0 ? Math.round(previousTotalProgress / previousAssignments) : 0

    const progressChange = previousAvgProgress > 0 
      ? ((recentAvgProgress - previousAvgProgress) / previousAvgProgress * 100).toFixed(0)
      : recentAvgProgress > 0 ? '100' : '0'

    return NextResponse.json({
      success: true,
      stats: {
        activeUsers: {
          value: activeUsers.toString(),
          change: usersChange.startsWith('-') ? usersChange : `+${usersChange}`,
          changeType: usersChangeType
        },
        assignedCourses: {
          value: totalAssignments.toString(),
          change: previousAssignments > 0 ? `${((recentAssignments - previousAssignments) / previousAssignments * 100).toFixed(0)}%` : recentAssignments > 0 ? '+100%' : '0%',
          changeType: recentAssignments >= previousAssignments ? 'positive' : 'negative'
        },
        completedCourses: {
          value: completedAssignments.toString(),
          change: previousCompleted > 0 ? `${((recentCompleted - previousCompleted) / previousCompleted * 100).toFixed(0)}%` : recentCompleted > 0 ? '+100%' : '0%',
          changeType: recentCompleted >= previousCompleted ? 'positive' : 'negative'
        },
        inProgress: {
          value: `${averageProgress}%`,
          change: progressChange.startsWith('-') ? progressChange : `+${progressChange}`,
          changeType: recentAvgProgress >= previousAvgProgress ? 'positive' : 'negative'
        },
        invitedUsers: {
          value: invitedUsersCount.toString(),
          change: invitedChange.startsWith('-') ? invitedChange : `+${invitedChange}`,
          changeType: invitedChangeType,
          linksCount: bulkLinkUsage
        },
        // Restaurar campos originales para evitar inconsistencias en el UI
        averageProgress,
        engagementRate: 0,
        certificates: 0,
        activity: [],
        usersChange,
        usersChangeType,
        assignmentsChange: previousAssignments > 0 ? `${((recentAssignments - previousAssignments) / previousAssignments * 100).toFixed(0)}%` : recentAssignments > 0 ? '+100%' : '0%',
        completedChange: previousCompleted > 0 ? `${((recentCompleted - previousCompleted) / previousCompleted * 100).toFixed(0)}%` : recentCompleted > 0 ? '+100%' : '0%',
        progressChange,
        engagementGrowth: '0%',
        certificateGrowth: '0%'
      }
    }, {
      headers: cacheHeaders.privateShort
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/dashboard/stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estadísticas del dashboard'
      },
      { status: 500 }
    )
  }
}
