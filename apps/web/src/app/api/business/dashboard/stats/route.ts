import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

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

function percentChange(recent: number, previous: number): string {
  if (previous > 0) {
    return `${Math.round(((recent - previous) / previous) * 100)}%`
  }
  return recent > 0 ? '+100%' : '0%'
}

function withSign(value: string): string {
  return value.startsWith('-') || value.startsWith('+') ? value : `+${value}`
}

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada',
        },
        { status: 403 },
      )
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 60)

    const [
      { data: orgUsers, error: usersError },
      { data: assignments, error: assignmentsError },
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
        .select('user_id, course_id, status, completion_percentage, assigned_at, completed_at, updated_at')
        .eq('organization_id', organizationId)
        .returns<DashboardAssignmentRow[]>(),
      supabase
        .from('user_course_certificates')
        .select('certificate_id, user_id, course_id, created_at')
        .eq('organization_id', organizationId)
        .returns<DashboardCertificateRow[]>(),
    ])

    if (usersError) logger.error('Error fetching active users:', usersError)
    if (assignmentsError) logger.error('Error fetching course assignments:', assignmentsError)
    if (certificatesError) logger.error('Error fetching certificates:', certificatesError)

    const activeUsersSet = new Set<string>()
    let activeUsers = 0
    let recentActiveUsers = 0
    let previousActiveUsers = 0

    for (const u of orgUsers || []) {
      if (u.status === 'active') {
        activeUsers += 1
        if (u.user_id) activeUsersSet.add(u.user_id)
        const joinedAt = u.joined_at ? new Date(u.joined_at) : null
        if (joinedAt && joinedAt >= thirtyDaysAgo) {
          recentActiveUsers += 1
        } else if (joinedAt && joinedAt >= previousPeriodStart) {
          previousActiveUsers += 1
        }
      }
    }

    const activeUserIds = Array.from(activeUsersSet)
    let enrollmentsData: DashboardEnrollmentRow[] = []

    if (activeUserIds.length > 0) {
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('user_course_enrollments')
        .select('user_id, course_id, enrollment_status, overall_progress_percentage, enrolled_at, started_at, completed_at, last_accessed_at, updated_at')
        .in('user_id', activeUserIds)
        .returns<DashboardEnrollmentRow[]>()

      if (enrollmentsError) logger.error('Error fetching enrollments:', enrollmentsError)
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
      const progress = Math.min(100, Math.max(0, assignment.completion_percentage || 0))
      const assignedAt = assignment.assigned_at ? new Date(assignment.assigned_at) : null
      const completedAt = assignment.completed_at ? new Date(assignment.completed_at) : null
      const isCompleted = assignment.status === 'completed' || progress >= 100 || Boolean(completedAt)
      const lastActivityAt = completedAt || (assignment.updated_at ? new Date(assignment.updated_at) : null)

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
      const progress = Math.min(100, Math.max(0, Number(enrollment.overall_progress_percentage) || 0))
      const completedAt = enrollment.completed_at ? new Date(enrollment.completed_at) : null
      const isCompleted = enrollment.enrollment_status === 'completed' || progress >= 100 || Boolean(completedAt)
      const enrolledAt = enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : null
      const lastActivityAt = completedAt ||
        (enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at) : null) ||
        (enrollment.updated_at ? new Date(enrollment.updated_at) : null) ||
        (enrollment.started_at ? new Date(enrollment.started_at) : null)

      const existing = courseStateMap.get(key)
      if (existing) {
        existing.progress = Math.max(existing.progress, progress)
        existing.isCompleted = existing.isCompleted || isCompleted || existing.progress >= 100
        if (completedAt && (!existing.completedAt || completedAt > existing.completedAt)) {
          existing.completedAt = completedAt
        }
        if (lastActivityAt && (!existing.lastActivityAt || lastActivityAt > existing.lastActivityAt)) {
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

    let totalAssignments = 0
    let completedAssignments = 0
    let totalProgress = 0
    let recentAssignments = 0
    let previousAssignments = 0
    let recentCompleted = 0
    let previousCompleted = 0
    let recentProgress = 0
    let previousProgress = 0
    const activeLearnersSet = new Set<string>()
    const recentActiveLearnersSet = new Set<string>()
    const previousActiveLearnersSet = new Set<string>()

    for (const state of courseStateMap.values()) {
      totalAssignments += 1
      totalProgress += state.progress
      if (state.isCompleted) completedAssignments += 1

      if (state.assignedAt && state.assignedAt >= thirtyDaysAgo) {
        recentAssignments += 1
        recentProgress += state.progress
      } else if (state.assignedAt && state.assignedAt >= previousPeriodStart) {
        previousAssignments += 1
        previousProgress += state.progress
      }

      if (state.isCompleted && state.completedAt && state.completedAt >= thirtyDaysAgo) {
        recentCompleted += 1
      } else if (state.isCompleted && state.completedAt && state.completedAt >= previousPeriodStart) {
        previousCompleted += 1
      }

      if (state.progress > 0 || state.isCompleted || state.lastActivityAt) {
        activeLearnersSet.add(state.userId)
        if (state.lastActivityAt && state.lastActivityAt >= thirtyDaysAgo) {
          recentActiveLearnersSet.add(state.userId)
        } else if (state.lastActivityAt && state.lastActivityAt >= previousPeriodStart) {
          previousActiveLearnersSet.add(state.userId)
        }
      }
    }

    const averageProgress = totalAssignments > 0 ? totalProgress / totalAssignments : 0
    const recentAvgProgress = recentAssignments > 0 ? recentProgress / recentAssignments : 0
    const previousAvgProgress = previousAssignments > 0 ? previousProgress / previousAssignments : 0

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

    const engagementRate = activeUsers > 0 ? Math.round((activeLearnersSet.size / activeUsers) * 100) : 0

    const usersChange = percentChange(recentActiveUsers, previousActiveUsers)
    const assignmentsChange = percentChange(recentAssignments, previousAssignments)
    const completedChange = percentChange(recentCompleted, previousCompleted)
    const progressChange = percentChange(recentAvgProgress, previousAvgProgress)
    const certificateGrowth = percentChange(recentCertificates, previousCertificates)
    const engagementGrowth = percentChange(recentActiveLearnersSet.size, previousActiveLearnersSet.size)

    return NextResponse.json(
      {
        success: true,
        stats: {
          activeUsers: {
            value: activeUsers.toString(),
            change: withSign(usersChange),
            changeType: recentActiveUsers >= previousActiveUsers ? 'positive' : 'negative',
          },
          assignedCourses: {
            value: totalAssignments.toString(),
            change: withSign(assignmentsChange),
            changeType: recentAssignments >= previousAssignments ? 'positive' : 'negative',
          },
          completedCourses: {
            value: completedAssignments.toString(),
            change: withSign(completedChange),
            changeType: recentCompleted >= previousCompleted ? 'positive' : 'negative',
          },
          completed: {
            value: completedAssignments.toString(),
            change: withSign(completedChange),
            changeType: recentCompleted >= previousCompleted ? 'positive' : 'negative',
          },
          inProgress: {
            value: `${Math.round(averageProgress)}%`,
            change: withSign(progressChange),
            changeType: recentAvgProgress >= previousAvgProgress ? 'positive' : 'negative',
          },
          certificates: {
            value: totalCertificates.toString(),
            change: withSign(certificateGrowth),
            changeType: recentCertificates >= previousCertificates ? 'positive' : 'negative',
          },
          engagement: {
            value: `${engagementRate}%`,
            change: withSign(engagementGrowth),
            changeType: recentActiveLearnersSet.size >= previousActiveLearnersSet.size ? 'positive' : 'negative',
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      },
    )
  } catch (error) {
    logger.error('💥 Error in /api/business/dashboard/stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estadísticas del dashboard',
      },
      { status: 500 },
    )
  }
}
