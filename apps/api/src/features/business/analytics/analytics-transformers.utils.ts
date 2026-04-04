import type {
  AnalyticsCourseAssignmentRecord,
  AnalyticsCourseEnrollmentRecord,
  AnalyticsExportScope,
  AnalyticsOrganizationNodeRecord,
  AnalyticsSourceData,
  AnalyticsTeam,
  AnalyticsTeamsData,
  AnalyticsUser,
  BusinessAnalyticsData,
} from './analytics.types'
import { roundToTwoDecimals, roundToWhole, csvEscape, sortByDateDesc } from './analytics-math.utils'
import {
  buildEnrollmentMap,
  formatTrendMap,
  getAssignmentProgress,
  getTeamMetadata,
  getUserProfile,
  groupByUserId,
  isAssignmentCompleted,
  processTrend,
} from './analytics-aggregation.utils'
import {
  calculateDuration,
  calculateFrequency,
  calculateHeatmap,
  calculateStickiness,
  calculateStreaks,
  getLastActive,
  getLatestStreak,
} from './analytics-metrics.utils'

export function getEmptyBusinessAnalyticsData(
  organization: AnalyticsSourceData['organization'],
): BusinessAnalyticsData {
  return {
    organization,
    general_metrics: {
      total_users: 0,
      total_courses_assigned: 0,
      completed_courses: 0,
      average_progress: 0,
      total_time_hours: 0,
      total_certificates: 0,
      active_users: 0,
      retention_rate: 0,
    },
    user_analytics: [],
    trends: {
      enrollments_by_month: [],
      completions_by_month: [],
      time_by_month: [],
      active_users_by_month: [],
    },
    by_role: {
      distribution: [],
      progress_comparison: [],
      completions: [],
      time_spent: [],
    },
    course_metrics: { distribution: [] },
    engagement_metrics: {
      stickiness: [],
      frequency: [],
      streaks: [],
      heatmap: [],
      duration: [],
    },
    teams: { total_teams: 0, teams: [], ranking: [] },
  }
}

function buildTeamsAnalytics(
  nodes: AnalyticsOrganizationNodeRecord[],
  assignmentsByUser: Map<string, AnalyticsCourseAssignmentRecord[]>,
  lessonProgressByUser: Map<string, AnalyticsSourceData['lessonProgress']>,
  activeUserIds: Set<string>,
  enrollmentMap: Map<string, AnalyticsCourseEnrollmentRecord>,
): AnalyticsTeamsData {
  const teams: AnalyticsTeam[] = nodes.map(node => {
    const memberIds = (node.organization_node_users ?? []).map(member => member.user_id)
    const teamAssignments = memberIds.flatMap(userId => assignmentsByUser.get(userId) ?? [])
    const teamLessonProgress = memberIds.flatMap(userId => lessonProgressByUser.get(userId) ?? [])
    const { description, image_url } = getTeamMetadata(node)
    const totalProgress = teamAssignments.reduce(
      (sum, a) => sum + getAssignmentProgress(a, enrollmentMap),
      0,
    )

    return {
      team_id: node.id,
      name: node.name,
      description,
      image_url,
      member_count: memberIds.length,
      stats: {
        average_progress:
          teamAssignments.length > 0 ? roundToTwoDecimals(totalProgress / teamAssignments.length) : 0,
        courses_completed: teamAssignments.filter(a => isAssignmentCompleted(a, enrollmentMap)).length,
        total_assignments: teamAssignments.length,
        total_time_hours: roundToTwoDecimals(
          teamLessonProgress.reduce((sum, p) => sum + (p.time_spent_minutes ?? 0), 0) / 60,
        ),
        active_members: memberIds.filter(id => activeUserIds.has(id)).length,
      },
    }
  })

  return {
    total_teams: teams.length,
    teams,
    ranking: [...teams].sort((l, r) => r.stats.average_progress - l.stats.average_progress),
  }
}

export function buildBusinessAnalyticsData(source: AnalyticsSourceData): BusinessAnalyticsData {
  if (source.orgUsers.length === 0) return getEmptyBusinessAnalyticsData(source.organization)

  const enrollmentMap = buildEnrollmentMap(source.enrollments)
  const assignmentsByUser = groupByUserId(source.assignments)
  const certificatesByUser = groupByUserId(source.certificates)
  const lessonProgressByUser = groupByUserId(source.lessonProgress)
  const dailyProgressByUser = groupByUserId(source.dailyProgress)
  const studySessionsByUser = groupByUserId(source.studySessions)
  const activeUserIds = new Set(
    source.dailyProgress
      .filter(e => e.had_activity && e.progress_date >= source.activeSinceDate)
      .map(e => e.user_id),
  )

  const userAnalytics: AnalyticsUser[] = source.orgUsers.map(orgUser => {
    const profile = getUserProfile(orgUser.users)
    const userAssignments = assignmentsByUser.get(orgUser.user_id) ?? []
    const userCertificates = certificatesByUser.get(orgUser.user_id) ?? []
    const userLessonProgress = lessonProgressByUser.get(orgUser.user_id) ?? []
    const userDailyProgress = dailyProgressByUser.get(orgUser.user_id) ?? []
    const userStudySessions = studySessionsByUser.get(orgUser.user_id) ?? []
    const totalProgress = userAssignments.reduce(
      (sum, a) => sum + getAssignmentProgress(a, enrollmentMap),
      0,
    )
    const totalTimeMinutes = userLessonProgress.reduce((sum, p) => sum + (p.time_spent_minutes ?? 0), 0)
    const completedSessions = userStudySessions.filter(s => s.status === 'completed').length
    const completedCourses = userAssignments.filter(a => isAssignmentCompleted(a, enrollmentMap)).length
    const lastActive = getLastActive(userDailyProgress)
    const totalSessions = userStudySessions.length

    return {
      user_id: orgUser.user_id,
      display_name: profile?.display_name || profile?.first_name || profile?.email?.split('@')[0] || 'Usuario',
      email: profile?.email ?? '',
      username: profile?.username ?? '',
      role: orgUser.job_title || orgUser.role || 'member',
      profile_picture_url: profile?.profile_picture_url ?? null,
      courses_assigned: userAssignments.length,
      courses_completed: completedCourses,
      average_progress: userAssignments.length > 0 ? roundToTwoDecimals(totalProgress / userAssignments.length) : 0,
      total_time_hours: roundToTwoDecimals(totalTimeMinutes / 60),
      total_time_minutes: totalTimeMinutes,
      certificates_count: userCertificates.length,
      last_login_at: profile?.last_login_at ?? null,
      last_active: lastActive ?? profile?.last_login_at ?? null,
      joined_at: orgUser.joined_at,
      stats: {
        current_streak: getLatestStreak(userDailyProgress),
        planner: {
          adherence: totalSessions > 0 ? roundToWhole((completedSessions / totalSessions) * 100) : 0,
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          pending_sessions: totalSessions - completedSessions,
        },
        courses: {
          total_lesson_time_minutes: totalTimeMinutes,
          lessons_completed: userLessonProgress.filter(p => p.is_completed).length,
          quizzes_completed: userLessonProgress.filter(p => p.quiz_completed).length,
          quizzes_passed: userLessonProgress.filter(p => p.quiz_passed).length,
        },
      },
    }
  })

  const totalCoursesAssigned = source.assignments.length
  const completedCourses = source.assignments.filter(a => isAssignmentCompleted(a, enrollmentMap)).length
  const totalProgress = source.assignments.reduce(
    (sum, a) => sum + getAssignmentProgress(a, enrollmentMap),
    0,
  )
  const totalTimeMinutes = source.lessonProgress.reduce((sum, p) => sum + (p.time_spent_minutes ?? 0), 0)

  const roleDistribution = new Map<string, number>()
  const roleProgress = new Map<string, { sum: number; count: number }>()
  const roleCompletions = new Map<string, number>()
  const roleTime = new Map<string, { sum: number; count: number }>()

  for (const user of userAnalytics) {
    roleDistribution.set(user.role, (roleDistribution.get(user.role) ?? 0) + 1)
    roleProgress.set(user.role, {
      sum: (roleProgress.get(user.role)?.sum ?? 0) + user.average_progress,
      count: (roleProgress.get(user.role)?.count ?? 0) + 1,
    })
    roleCompletions.set(user.role, (roleCompletions.get(user.role) ?? 0) + user.courses_completed)
    roleTime.set(user.role, {
      sum: (roleTime.get(user.role)?.sum ?? 0) + user.total_time_hours,
      count: (roleTime.get(user.role)?.count ?? 0) + 1,
    })
  }

  const enrollmentsByMonth = new Map<string, number>()
  const completionsByMonth = new Map<string, number>()
  const timeByMonth = new Map<string, number>()
  const activeUsersByMonth = new Map<string, Set<string>>()

  for (const assignment of source.assignments) {
    processTrend(assignment.assigned_at, enrollmentsByMonth)
    if (isAssignmentCompleted(assignment, enrollmentMap)) {
      processTrend(assignment.completed_at, completionsByMonth)
    }
  }

  for (const progress of source.lessonProgress) {
    processTrend(
      progress.completed_at ?? progress.last_accessed_at,
      timeByMonth,
      progress.time_spent_minutes ?? 0,
    )
  }

  for (const entry of source.dailyProgress) {
    if (!entry.had_activity) continue
    const monthKey = entry.progress_date.slice(0, 7)
    const users = activeUsersByMonth.get(monthKey) ?? new Set<string>()
    users.add(entry.user_id)
    activeUsersByMonth.set(monthKey, users)
  }

  const distributionByStatus = new Map<string, number>()
  for (const assignment of source.assignments) {
    const progress = getAssignmentProgress(assignment, enrollmentMap)
    const status = isAssignmentCompleted(assignment, enrollmentMap)
      ? 'completed'
      : progress > 0 ? 'in_progress' : 'not_started'
    distributionByStatus.set(status, (distributionByStatus.get(status) ?? 0) + 1)
  }

  const teams = buildTeamsAnalytics(
    source.nodes,
    assignmentsByUser,
    lessonProgressByUser,
    activeUserIds,
    enrollmentMap,
  )

  return {
    organization: source.organization,
    general_metrics: {
      total_users: source.orgUsers.length,
      total_courses_assigned: totalCoursesAssigned,
      completed_courses: completedCourses,
      average_progress: totalCoursesAssigned > 0 ? roundToTwoDecimals(totalProgress / totalCoursesAssigned) : 0,
      total_time_hours: roundToTwoDecimals(totalTimeMinutes / 60),
      total_certificates: source.certificates.length,
      active_users: activeUserIds.size,
      retention_rate: source.orgUsers.length > 0 ? roundToWhole((activeUserIds.size / source.orgUsers.length) * 100) : 0,
    },
    user_analytics: userAnalytics,
    trends: {
      enrollments_by_month: formatTrendMap(enrollmentsByMonth),
      completions_by_month: formatTrendMap(completionsByMonth),
      time_by_month: formatTrendMap(timeByMonth).map(e => ({ ...e, count: roundToTwoDecimals(e.count / 60) })),
      active_users_by_month: Array.from(activeUsersByMonth.entries())
        .map(([date, users]) => ({ date, count: users.size }))
        .sort((l, r) => l.date.localeCompare(r.date)),
    },
    by_role: {
      distribution: Array.from(roleDistribution.entries()).map(([role, count]) => ({ role, count })),
      progress_comparison: Array.from(roleProgress.entries()).map(([role, e]) => ({
        role,
        average_progress: e.count > 0 ? roundToTwoDecimals(e.sum / e.count) : 0,
      })),
      completions: Array.from(roleCompletions.entries()).map(([role, total_completed]) => ({ role, total_completed })),
      time_spent: Array.from(roleTime.entries()).map(([role, e]) => ({
        role,
        average_hours: e.count > 0 ? roundToTwoDecimals(e.sum / e.count) : 0,
      })),
    },
    course_metrics: {
      distribution: Array.from(distributionByStatus.entries()).map(([status, count]) => ({ status, count })),
    },
    engagement_metrics: {
      stickiness: calculateStickiness(source.dailyProgress),
      frequency: calculateFrequency(source.dailyProgress, source.activeSinceDate),
      streaks: calculateStreaks(source.dailyProgress, source.orgUsers.map(u => u.user_id)),
      heatmap: calculateHeatmap(source.studySessions),
      duration: calculateDuration(source.studySessions, source.orgUsers),
    },
    teams,
  }
}

export function buildAnalyticsCsv(data: BusinessAnalyticsData, scope: AnalyticsExportScope) {
  if (scope === 'summary') {
    const rows = [
      ['metric', 'value'],
      ['organization_name', data.organization.name],
      ['total_users', data.general_metrics.total_users],
      ['active_users', data.general_metrics.active_users],
      ['total_courses_assigned', data.general_metrics.total_courses_assigned],
      ['completed_courses', data.general_metrics.completed_courses],
      ['average_progress', data.general_metrics.average_progress],
      ['total_time_hours', data.general_metrics.total_time_hours],
      ['total_certificates', data.general_metrics.total_certificates],
      ['retention_rate', data.general_metrics.retention_rate],
    ]
    return rows.map(row => row.map(csvEscape).join(',')).join('\n')
  }

  if (scope === 'teams') {
    const rows = [
      ['team_id', 'name', 'member_count', 'active_members', 'average_progress', 'courses_completed', 'total_assignments', 'total_time_hours'],
      ...data.teams.teams.map(t => [
        t.team_id, t.name, t.member_count, t.stats.active_members,
        t.stats.average_progress, t.stats.courses_completed, t.stats.total_assignments, t.stats.total_time_hours,
      ]),
    ]
    return rows.map(row => row.map(csvEscape).join(',')).join('\n')
  }

  const rows = [
    ['user_id', 'display_name', 'email', 'role', 'courses_assigned', 'courses_completed', 'average_progress', 'total_time_hours', 'certificates_count', 'last_login_at', 'last_active'],
    ...data.user_analytics.map(u => [
      u.user_id, u.display_name, u.email, u.role, u.courses_assigned,
      u.courses_completed, u.average_progress, u.total_time_hours,
      u.certificates_count, u.last_login_at, u.last_active,
    ]),
  ]
  return rows.map(row => row.map(csvEscape).join(',')).join('\n')
}
