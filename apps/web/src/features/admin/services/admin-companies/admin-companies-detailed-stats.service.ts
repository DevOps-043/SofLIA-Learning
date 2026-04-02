import type { CompanyDetailedStats } from '../../types/admin-companies.types'

export interface CompanyDetailedStatsAssignmentRow {
  course_id: string
  completion_percentage?: number | null
  status?: string | null
  courses?: {
    title?: string | null
  } | null
}

export interface CompanyDetailedStatsSessionRow {
  actual_duration_minutes?: number | null
  completed_at?: string | null
  self_evaluation?: number | null
  user_id?: string | null
}

type TeamRelation =
  | {
      name?: string | null
    }
  | Array<{
      name?: string | null
    }>
  | null
  | undefined

export interface CompanyDetailedStatsMemberRow {
  status?: string | null
  organization_teams?: TeamRelation
}

interface BuildCompanyDetailedStatsOptions {
  assignments: CompanyDetailedStatsAssignmentRow[]
  sessions: CompanyDetailedStatsSessionRow[]
  members: CompanyDetailedStatsMemberRow[]
  pendingInvitationCount: number
  now?: Date
}

function resolveTeamName(teamRelation: TeamRelation): string {
  if (Array.isArray(teamRelation)) {
    return teamRelation[0]?.name || 'Sin Equipo'
  }

  return teamRelation?.name || 'Sin Equipo'
}

export function buildCompanyDetailedStats({
  assignments,
  sessions,
  members,
  pendingInvitationCount,
  now = new Date(),
}: BuildCompanyDetailedStatsOptions): CompanyDetailedStats {
  const distinctCourses = new Set(assignments.map((assignment) => assignment.course_id)).size
  const totalLearningMinutes = sessions.reduce(
    (minutes, session) => minutes + (session.actual_duration_minutes || 0),
    0
  )

  const activeUsers = members.filter((member) => member.status === 'active').length
  const invitedUsersInOrganization = members.filter((member) => member.status === 'invited').length
  const totalInvited = invitedUsersInOrganization + pendingInvitationCount
  const totalUsers = members.length

  const monthlyData: Record<string, { month: string; hours: number; sessions: number }> = {}
  const monthsOrder: string[] = []

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date(now)
    monthDate.setMonth(monthDate.getMonth() - offset)
    const monthKey = monthDate.toLocaleString('es-MX', { month: 'short' }).replace('.', '').toUpperCase()
    monthlyData[monthKey] = { month: monthKey, hours: 0, sessions: 0 }
    monthsOrder.push(monthKey)
  }

  sessions.forEach((session) => {
    if (!session.completed_at) {
      return
    }

    const completedAt = new Date(session.completed_at)
    const monthKey = completedAt.toLocaleString('es-MX', { month: 'short' }).replace('.', '').toUpperCase()

    if (monthlyData[monthKey]) {
      monthlyData[monthKey].hours += (session.actual_duration_minutes || 0) / 60
      monthlyData[monthKey].sessions += 1
    }
  })

  const courseStatsMap: Record<string, { title: string; totalProgress: number; count: number; completed: number }> = {}
  assignments.forEach((assignment) => {
    const courseTitle = assignment.courses?.title || 'Curso sin titulo'
    const courseStats = courseStatsMap[assignment.course_id] || {
      title: courseTitle,
      totalProgress: 0,
      count: 0,
      completed: 0,
    }

    courseStats.totalProgress += assignment.completion_percentage || 0
    courseStats.count += 1
    if (assignment.status === 'completed') {
      courseStats.completed += 1
    }

    courseStatsMap[assignment.course_id] = courseStats
  })

  const teamStatsMap: Record<string, number> = {}
  members.forEach((member) => {
    const teamName = resolveTeamName(member.organization_teams)
    teamStatsMap[teamName] = (teamStatsMap[teamName] || 0) + 1
  })

  const ratedSessions = sessions.filter((session) => session.self_evaluation != null)
  const avgSatisfaction =
    ratedSessions.length > 0
      ? ratedSessions.reduce((score, session) => score + (session.self_evaluation ?? 0), 0) / ratedSessions.length
      : 0

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentlyActiveUsersCount = new Set(
    sessions
      .filter((session) => session.completed_at && new Date(session.completed_at) >= sevenDaysAgo && session.user_id)
      .map((session) => session.user_id)
  ).size

  return {
    overview: {
      totalUsers,
      activeUsers,
      invitedUsers: totalInvited,
      assignedCourses: distinctCourses,
      totalLearningHours: Math.round(totalLearningMinutes / 60),
      totalSessions: sessions.length,
      engagementRate: totalUsers > 0 ? Math.round((recentlyActiveUsersCount / totalUsers) * 100) : 0,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
    },
    activityMonthly: monthsOrder.map((monthKey) => ({
      ...monthlyData[monthKey],
      hours: Math.round(monthlyData[monthKey].hours * 10) / 10,
    })),
    courseProgress: Object.entries(courseStatsMap)
      .map(([id, stats]) => ({
        id,
        title: stats.title,
        averageProgress: stats.count > 0 ? Math.round(stats.totalProgress / stats.count) : 0,
        enrolledCount: stats.count,
        completedCount: stats.completed,
      }))
      .sort((left, right) => right.enrolledCount - left.enrolledCount)
      .slice(0, 5),
    teamDistribution: Object.entries(teamStatsMap)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((left, right) => right.value - left.value),
  }
}
