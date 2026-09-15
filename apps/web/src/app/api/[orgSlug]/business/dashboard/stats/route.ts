import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'

interface OrganizationUserStatsRow {
  user_id: string | null
  created_at: string | null
  joined_at: string | null
  status: string | null
}

interface DashboardAssignmentRow {
  user_id: string | null
  course_id: string | null
  assigned_at: string | null
  completed_at: string | null
  completion_percentage: number | null
  status: string | null
  updated_at: string | null
}

interface DashboardEnrollmentRow {
  user_id: string | null
  course_id: string | null
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  overall_progress_percentage: number | null
  enrollment_status: string | null
  updated_at: string | null
}

interface DashboardCertificateRow {
  certificate_id: string
  user_id: string | null
  course_id: string | null
  created_at: string | null
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
  total_certificates: number
  recent_certificates: number
  previous_certificates: number
  engagement_rate: number
  recent_active_learners: number
  previous_active_learners: number
}

type DashboardSupabaseClient = ReturnType<typeof createAdminClient>

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
    total_certificates: toNumber(aggregate?.total_certificates),
    recent_certificates: toNumber(aggregate?.recent_certificates),
    previous_certificates: toNumber(aggregate?.previous_certificates),
    engagement_rate: toNumber(aggregate?.engagement_rate),
    recent_active_learners: toNumber(aggregate?.recent_active_learners),
    previous_active_learners: toNumber(aggregate?.previous_active_learners),
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
  const certificateGrowth = percentChange(
    aggregate.recent_certificates,
    aggregate.previous_certificates,
  )
  const engagementGrowth = percentChange(
    aggregate.recent_active_learners,
    aggregate.previous_active_learners,
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
    certificates: {
      value: String(aggregate.total_certificates),
      change: withSign(certificateGrowth),
      changeType:
        aggregate.recent_certificates >= aggregate.previous_certificates
          ? 'positive'
          : 'negative',
    },
    engagement: {
      value: `${Math.round(aggregate.engagement_rate)}%`,
      change: withSign(engagementGrowth),
      changeType:
        aggregate.recent_active_learners >= aggregate.previous_active_learners
          ? 'positive'
          : 'negative',
    },
    invitedUsers: {
      value: String(
        aggregate.invited_org_users + aggregate.pending_invitations,
      ),
      change: withSign(invitedChange),
      changeType:
        aggregate.recent_invited_users >= aggregate.previous_invited_users
          ? 'positive'
          : 'negative',
      linksCount: aggregate.bulk_link_usage,
    },
    averageProgress: Math.round(aggregate.average_progress),
    engagementRate: Math.round(aggregate.engagement_rate),
    certificatesCount: aggregate.total_certificates,
    activity: [],
    usersChange,
    usersChangeType:
      aggregate.recent_active_users >= aggregate.previous_active_users
        ? 'positive'
        : 'negative',
    assignmentsChange,
    completedChange,
    progressChange,
    engagementGrowth,
    certificateGrowth,
  }
}

async function loadDashboardAggregateComprehensive(
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
    { data: certificatesData, error: certificatesError },
  ] = await Promise.all([
    supabase
      .from('organization_users')
      .select('user_id, status, joined_at, created_at')
      .eq('organization_id', organizationId)
      .in('status', ['active', 'invited'])
      .returns<OrganizationUserStatsRow[]>(),
    supabase
      .from('organization_course_assignments')
      .select(
        'user_id, course_id, status, completion_percentage, assigned_at, completed_at, updated_at',
      )
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
    supabase
      .from('user_course_certificates')
      .select('certificate_id, user_id, course_id, created_at')
      .eq('organization_id', organizationId)
      .returns<DashboardCertificateRow[]>(),
  ])

  if (usersError) logger.error('Error fetching organization users:', usersError)
  if (assignmentsError)
    logger.error('Error fetching assignments:', assignmentsError)
  if (invitationsError)
    logger.error('Error fetching pending invitations:', invitationsError)
  if (linksError) logger.error('Error fetching bulk invite links:', linksError)
  if (certificatesError)
    logger.error('Error fetching certificates:', certificatesError)

  const activeUsersSet = new Set<string>()
  const aggregate = normalizeAggregate(null)

  for (const user of orgUsers || []) {
    if (user.status === 'active') {
      aggregate.active_users += 1
      if (user.user_id) activeUsersSet.add(user.user_id)
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

  const activeUserIds = Array.from(activeUsersSet)
  let enrollmentsData: DashboardEnrollmentRow[] = []

  if (activeUserIds.length > 0) {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('user_course_enrollments')
      .select(
        'user_id, course_id, enrollment_status, overall_progress_percentage, enrolled_at, started_at, completed_at, last_accessed_at, updated_at',
      )
      .in('user_id', activeUserIds)
      .returns<DashboardEnrollmentRow[]>()

    if (enrollmentsError)
      logger.error('Error fetching enrollments:', enrollmentsError)
    else enrollmentsData = enrollments || []
  }

  interface CombinedCourseState {
    userId: string
    courseId: string
    progress: number
    isCompleted: boolean
    assignedAt: Date | null
    completedAt: Date | null
    lastActivityAt: Date | null
  }

  const courseStateMap = new Map<string, CombinedCourseState>()

  for (const assignment of assignments || []) {
    if (!assignment.user_id || !assignment.course_id) continue
    const key = `${assignment.user_id}:${assignment.course_id}`
    const progress = Math.min(
      100,
      Math.max(0, assignment.completion_percentage || 0),
    )
    const assignedAt = assignment.assigned_at
      ? new Date(assignment.assigned_at)
      : null
    const completedAt = assignment.completed_at
      ? new Date(assignment.completed_at)
      : null
    const isCompleted =
      assignment.status === 'completed' ||
      progress >= 100 ||
      Boolean(completedAt)
    const lastActivityAt =
      completedAt ||
      (assignment.updated_at ? new Date(assignment.updated_at) : null)

    courseStateMap.set(key, {
      userId: assignment.user_id,
      courseId: assignment.course_id,
      progress,
      isCompleted,
      assignedAt,
      completedAt,
      lastActivityAt,
    })
  }

  for (const enrollment of enrollmentsData) {
    if (!enrollment.user_id || !enrollment.course_id) continue
    const key = `${enrollment.user_id}:${enrollment.course_id}`
    const progress = Math.min(
      100,
      Math.max(0, Number(enrollment.overall_progress_percentage) || 0),
    )
    const completedAt = enrollment.completed_at
      ? new Date(enrollment.completed_at)
      : null
    const isCompleted =
      enrollment.enrollment_status === 'completed' ||
      progress >= 100 ||
      Boolean(completedAt)
    const enrolledAt = enrollment.enrolled_at
      ? new Date(enrollment.enrolled_at)
      : null
    const lastActivityAt =
      completedAt ||
      (enrollment.last_accessed_at
        ? new Date(enrollment.last_accessed_at)
        : null) ||
      (enrollment.updated_at ? new Date(enrollment.updated_at) : null) ||
      (enrollment.started_at ? new Date(enrollment.started_at) : null)

    const existing = courseStateMap.get(key)
    if (existing) {
      existing.progress = Math.max(existing.progress, progress)
      existing.isCompleted =
        existing.isCompleted || isCompleted || existing.progress >= 100
      if (
        completedAt &&
        (!existing.completedAt || completedAt > existing.completedAt)
      ) {
        existing.completedAt = completedAt
      }
      if (
        lastActivityAt &&
        (!existing.lastActivityAt || lastActivityAt > existing.lastActivityAt)
      ) {
        existing.lastActivityAt = lastActivityAt
      }
    } else {
      courseStateMap.set(key, {
        userId: enrollment.user_id,
        courseId: enrollment.course_id,
        progress,
        isCompleted,
        assignedAt: enrolledAt,
        completedAt,
        lastActivityAt,
      })
    }
  }

  let totalProgress = 0
  let recentProgress = 0
  let previousProgress = 0
  const activeLearnersSet = new Set<string>()
  const recentActiveLearnersSet = new Set<string>()
  const previousActiveLearnersSet = new Set<string>()

  for (const state of courseStateMap.values()) {
    aggregate.total_assignments += 1
    totalProgress += state.progress
    if (state.isCompleted) aggregate.completed_assignments += 1

    if (state.assignedAt && state.assignedAt >= thirtyDaysAgo) {
      aggregate.recent_assignments += 1
      recentProgress += state.progress
    } else if (state.assignedAt && state.assignedAt >= previousPeriodStart) {
      aggregate.previous_assignments += 1
      previousProgress += state.progress
    }

    if (
      state.isCompleted &&
      state.completedAt &&
      state.completedAt >= thirtyDaysAgo
    ) {
      aggregate.recent_completed += 1
    } else if (
      state.isCompleted &&
      state.completedAt &&
      state.completedAt >= previousPeriodStart
    ) {
      aggregate.previous_completed += 1
    }

    if (state.progress > 0 || state.isCompleted || state.lastActivityAt) {
      activeLearnersSet.add(state.userId)
      if (state.lastActivityAt && state.lastActivityAt >= thirtyDaysAgo) {
        recentActiveLearnersSet.add(state.userId)
      } else if (
        state.lastActivityAt &&
        state.lastActivityAt >= previousPeriodStart
      ) {
        previousActiveLearnersSet.add(state.userId)
      }
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

  let totalCertificates = 0
  let recentCertificates = 0
  let previousCertificates = 0

  for (const cert of certificatesData || []) {
    totalCertificates += 1
    const createdAt = cert.created_at ? new Date(cert.created_at) : null
    if (createdAt && createdAt >= thirtyDaysAgo) {
      recentCertificates += 1
    } else if (createdAt && createdAt >= previousPeriodStart) {
      previousCertificates += 1
    }
  }

  aggregate.total_certificates = totalCertificates
  aggregate.recent_certificates = recentCertificates
  aggregate.previous_certificates = previousCertificates

  const totalActiveUsers = aggregate.active_users
  aggregate.engagement_rate =
    totalActiveUsers > 0
      ? Math.round((activeLearnersSet.size / totalActiveUsers) * 100)
      : 0
  aggregate.recent_active_learners = recentActiveLearnersSet.size
  aggregate.previous_active_learners = previousActiveLearnersSet.size

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

    if (!auth.organizationId || !auth.isOrgAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No tienes permisos para ver estadisticas de esta organizacion',
        },
        { status: 403 },
      )
    }

    const supabase = createAdminClient()
    const aggregate = await loadDashboardAggregateComprehensive(
      supabase,
      auth.organizationId,
    )

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
