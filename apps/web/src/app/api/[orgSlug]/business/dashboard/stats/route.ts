import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'

interface OrganizationUserStatsRow {
  created_at: string | null
  joined_at: string | null
  status: string | null
}

interface DashboardAssignmentRow {
  assigned_at: string | null
  completed_at: string | null
  completion_percentage: number | null
  status: string | null
}

interface BusinessDashboardAggregate {
  active_users: number
  invited_org_users: number
  pending_invitations: number
  bulk_link_usage: number
  recent_active_users: number
  previous_active_users: number
  recent_invited_users: number
  previous_invited_users: number
  total_assignments: number
  completed_assignments: number
  recent_assignments: number
  previous_assignments: number
  recent_completed: number
  previous_completed: number
  average_progress: number
  recent_average_progress: number
  previous_average_progress: number
}

interface BusinessDashboardStatsRpcClient {
  rpc(
    fn: 'get_business_dashboard_stats',
    args: { target_organization_id: string },
  ): PromiseLike<{
    data: BusinessDashboardAggregate[] | BusinessDashboardAggregate | null
    error: { message?: string } | null
  }>
}

type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizeAggregate(
  aggregate: Partial<BusinessDashboardAggregate> | null | undefined,
): BusinessDashboardAggregate {
  return {
    active_users: toNumber(aggregate?.active_users),
    invited_org_users: toNumber(aggregate?.invited_org_users),
    pending_invitations: toNumber(aggregate?.pending_invitations),
    bulk_link_usage: toNumber(aggregate?.bulk_link_usage),
    recent_active_users: toNumber(aggregate?.recent_active_users),
    previous_active_users: toNumber(aggregate?.previous_active_users),
    recent_invited_users: toNumber(aggregate?.recent_invited_users),
    previous_invited_users: toNumber(aggregate?.previous_invited_users),
    total_assignments: toNumber(aggregate?.total_assignments),
    completed_assignments: toNumber(aggregate?.completed_assignments),
    recent_assignments: toNumber(aggregate?.recent_assignments),
    previous_assignments: toNumber(aggregate?.previous_assignments),
    recent_completed: toNumber(aggregate?.recent_completed),
    previous_completed: toNumber(aggregate?.previous_completed),
    average_progress: toNumber(aggregate?.average_progress),
    recent_average_progress: toNumber(aggregate?.recent_average_progress),
    previous_average_progress: toNumber(aggregate?.previous_average_progress),
  }
}

function percentChange(recent: number, previous: number): string {
  if (previous > 0) {
    return `${Math.round(((recent - previous) / previous) * 100)}%`
  }

  return recent > 0 ? '+100%' : '0%'
}

function withSign(value: string): string {
  return value.startsWith('-') || value.startsWith('+') ? value : `+${value}`
}

function buildDashboardStats(aggregate: BusinessDashboardAggregate) {
  const usersChange = percentChange(
    aggregate.recent_active_users,
    aggregate.previous_active_users,
  )
  const invitedChange = percentChange(
    aggregate.recent_invited_users,
    aggregate.previous_invited_users,
  )
  const assignmentsChange = percentChange(
    aggregate.recent_assignments,
    aggregate.previous_assignments,
  )
  const completedChange = percentChange(
    aggregate.recent_completed,
    aggregate.previous_completed,
  )
  const progressChange = percentChange(
    aggregate.recent_average_progress,
    aggregate.previous_average_progress,
  )

  return {
    activeUsers: {
      value: String(aggregate.active_users),
      change: withSign(usersChange),
      changeType:
        aggregate.recent_active_users >= aggregate.previous_active_users
          ? 'positive'
          : 'negative',
    },
    assignedCourses: {
      value: String(aggregate.total_assignments),
      change: withSign(assignmentsChange),
      changeType:
        aggregate.recent_assignments >= aggregate.previous_assignments
          ? 'positive'
          : 'negative',
    },
    completedCourses: {
      value: String(aggregate.completed_assignments),
      change: withSign(completedChange),
      changeType:
        aggregate.recent_completed >= aggregate.previous_completed
          ? 'positive'
          : 'negative',
    },
    inProgress: {
      value: `${Math.round(aggregate.average_progress)}%`,
      change: withSign(progressChange),
      changeType:
        aggregate.recent_average_progress >= aggregate.previous_average_progress
          ? 'positive'
          : 'negative',
    },
    invitedUsers: {
      value: String(aggregate.invited_org_users + aggregate.pending_invitations),
      change: withSign(invitedChange),
      changeType:
        aggregate.recent_invited_users >= aggregate.previous_invited_users
          ? 'positive'
          : 'negative',
      linksCount: aggregate.bulk_link_usage,
    },
    averageProgress: Math.round(aggregate.average_progress),
    engagementRate: 0,
    certificates: 0,
    activity: [],
    usersChange,
    usersChangeType:
      aggregate.recent_active_users >= aggregate.previous_active_users
        ? 'positive'
        : 'negative',
    assignmentsChange,
    completedChange,
    progressChange,
    engagementGrowth: '0%',
    certificateGrowth: '0%',
  }
}

async function loadDashboardAggregateFromRpc(
  supabase: DashboardSupabaseClient,
  organizationId: string,
): Promise<BusinessDashboardAggregate | null> {
  const { data, error } = await (
    supabase as unknown as BusinessDashboardStatsRpcClient
  ).rpc('get_business_dashboard_stats', {
    target_organization_id: organizationId,
  })

  if (error) {
    logger.warn('Business dashboard stats RPC unavailable, using fallback', {
      organizationId,
      error: error.message,
    })
    return null
  }

  const aggregate = Array.isArray(data) ? data[0] : data
  return normalizeAggregate(aggregate)
}

async function loadDashboardAggregateFallback(
  supabase: DashboardSupabaseClient,
  organizationId: string,
): Promise<BusinessDashboardAggregate> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const previousPeriodStart = new Date()
  previousPeriodStart.setDate(previousPeriodStart.getDate() - 60)

  const [
    { data: orgUsers, error: usersError },
    { data: assignments, error: assignmentsError },
    { count: pendingInvitationCount, error: invitationsError },
    { data: bulkLinks, error: linksError },
  ] = await Promise.all([
    supabase
      .from('organization_users')
      .select('status, joined_at, created_at')
      .eq('organization_id', organizationId)
      .in('status', ['active', 'invited'])
      .returns<OrganizationUserStatsRow[]>(),
    supabase
      .from('organization_course_assignments')
      .select('status, completion_percentage, assigned_at, completed_at')
      .eq('organization_id', organizationId)
      .returns<DashboardAssignmentRow[]>(),
    supabase
      .from('user_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending'),
    supabase
      .from('bulk_invite_links')
      .select('current_uses')
      .eq('organization_id', organizationId)
      .returns<Array<{ current_uses: number | null }>>(),
  ])

  if (usersError) logger.error('Error fetching organization users:', usersError)
  if (assignmentsError) logger.error('Error fetching assignments:', assignmentsError)
  if (invitationsError) logger.error('Error fetching pending invitations:', invitationsError)
  if (linksError) logger.error('Error fetching bulk invite links:', linksError)

  const aggregate = normalizeAggregate(null)

  for (const user of orgUsers || []) {
    if (user.status === 'active') {
      aggregate.active_users += 1
      if (user.joined_at && new Date(user.joined_at) >= thirtyDaysAgo) {
        aggregate.recent_active_users += 1
      } else if (
        user.joined_at &&
        new Date(user.joined_at) >= previousPeriodStart
      ) {
        aggregate.previous_active_users += 1
      }
    }

    if (user.status === 'invited') {
      aggregate.invited_org_users += 1
      if (user.created_at && new Date(user.created_at) >= thirtyDaysAgo) {
        aggregate.recent_invited_users += 1
      } else if (
        user.created_at &&
        new Date(user.created_at) >= previousPeriodStart
      ) {
        aggregate.previous_invited_users += 1
      }
    }
  }

  aggregate.pending_invitations = pendingInvitationCount || 0
  aggregate.bulk_link_usage = (bulkLinks || []).reduce(
    (sum, link) => sum + (link.current_uses || 0),
    0,
  )

  let totalProgress = 0
  let recentProgress = 0
  let previousProgress = 0

  for (const assignment of assignments || []) {
    const completion = assignment.completion_percentage || 0
    const assignedAt = assignment.assigned_at
      ? new Date(assignment.assigned_at)
      : null
    const completedAt = assignment.completed_at
      ? new Date(assignment.completed_at)
      : null
    const isCompleted = assignment.status === 'completed' || completion >= 100

    aggregate.total_assignments += 1
    totalProgress += completion
    if (isCompleted) aggregate.completed_assignments += 1

    if (assignedAt && assignedAt >= thirtyDaysAgo) {
      aggregate.recent_assignments += 1
      recentProgress += completion
    } else if (assignedAt && assignedAt >= previousPeriodStart) {
      aggregate.previous_assignments += 1
      previousProgress += completion
    }

    if (isCompleted && completedAt && completedAt >= thirtyDaysAgo) {
      aggregate.recent_completed += 1
    } else if (isCompleted && completedAt && completedAt >= previousPeriodStart) {
      aggregate.previous_completed += 1
    }
  }

  aggregate.average_progress =
    aggregate.total_assignments > 0
      ? totalProgress / aggregate.total_assignments
      : 0
  aggregate.recent_average_progress =
    aggregate.recent_assignments > 0
      ? recentProgress / aggregate.recent_assignments
      : 0
  aggregate.previous_average_progress =
    aggregate.previous_assignments > 0
      ? previousProgress / aggregate.previous_assignments
      : 0

  return aggregate
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizacion asignada' },
        { status: 403 },
      )
    }

    const supabase = await createClient()
    const aggregate =
      (await loadDashboardAggregateFromRpc(supabase, auth.organizationId)) ||
      (await loadDashboardAggregateFallback(supabase, auth.organizationId))

    return NextResponse.json(
      {
        success: true,
        stats: buildDashboardStats(aggregate),
      },
      { headers: cacheHeaders.privateShort },
    )
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/dashboard/stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estadisticas del dashboard',
      },
      { status: 500 },
    )
  }
}
