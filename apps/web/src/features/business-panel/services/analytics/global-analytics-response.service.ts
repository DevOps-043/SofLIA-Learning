import type {
  BusinessAnalyticsApiResponse,
} from '../../types/analytics.types'
import {
  calculateDuration,
  calculateFrequency,
  calculateHeatmap,
  calculateStickiness,
  calculateStreaks,
} from './engagement-metrics.service'
import type { GlobalAnalyticsQueryData } from './global-analytics-query.service'
import {
  buildGlobalUserAnalytics,
  getGlobalAnalyticsProfile,
} from './global-analytics-user-analytics'

export function getEmptyGlobalAnalyticsResponse(): BusinessAnalyticsApiResponse {
  return {
    success: true,
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
    course_metrics: {
      distribution: [],
      top_by_time: [],
    },
    study_planner: {
      users_with_plans: 0,
      total_plans: 0,
      total_sessions: 0,
      completed_sessions: 0,
      missed_sessions: 0,
      pending_sessions: 0,
      in_progress_sessions: 0,
      ai_generated_sessions: 0,
      sessions_by_status: [],
      usage_rate: 0,
      average_session_duration_minutes: 0,
      total_study_hours: 0,
      plan_adherence_rate: 0,
      on_time_completion_rate: 0,
      avg_sessions_per_user: 0,
      user_adherence: [],
    },
    engagement_metrics: {
      stickiness: [],
      frequency: [],
      streaks: [],
      heatmap: [],
      duration: [],
    },
    teams: {
      total_teams: 0,
      teams: [],
      ranking: [],
    },
  }
}

export function buildGlobalAnalyticsResponse(
  data: GlobalAnalyticsQueryData,
): BusinessAnalyticsApiResponse {
  if (data.orgUsers.length === 0) {
    return getEmptyGlobalAnalyticsResponse()
  }

  const enrollmentsByUserId = groupItemsByUserId(data.enrollments)
  const certificatesByUserId = groupItemsByUserId(data.certificates)
  const lessonProgressByUserId = groupItemsByUserId(data.lessonProgress)
  const dailyProgressByUserId = groupItemsByUserId(data.dailyProgress)
  const studySessionsByUserId = groupItemsByUserId(data.studySessions)
  const studyPlanProgressByUserId = groupItemsByUserId(data.studyPlanProgress)
  const liaConversationsByUserId = groupItemsByUserId(data.liaConversations)
  const liaMessagesByConversationId = groupItemsByConversationId(data.liaMessages)
  const userNotesByUserId = groupItemsByUserId(data.userNotes)
  const roleByUserId = new Map<string, string>()
  const roleDistribution = new Map<string, number>()
  const roleProgress = new Map<string, { sum: number; count: number }>()
  const roleCompletions = new Map<string, number>()
  const roleTime = new Map<string, { sum: number; count: number }>()
  const enrollmentsByMonth = new Map<string, number>()
  const completionsByMonth = new Map<string, number>()
  const timeByMonth = new Map<string, number>()
  const activeUsersByMonth = new Map<string, Set<string>>()
  const courseDistribution = new Map<string, number>()

  data.orgUsers.forEach((organizationUser) => {
    const role = organizationUser.job_title || organizationUser.role || 'member'
    roleByUserId.set(organizationUser.user_id, role)
    roleDistribution.set(role, (roleDistribution.get(role) || 0) + 1)
    if (!roleProgress.has(role)) roleProgress.set(role, { sum: 0, count: 0 })
    if (!roleCompletions.has(role)) roleCompletions.set(role, 0)
    if (!roleTime.has(role)) roleTime.set(role, { sum: 0, count: 0 })
  })

  data.assignments.forEach((assignment) => {
    const progress = assignment.completion_percentage || 0
    const role = roleByUserId.get(assignment.user_id) || 'member'
    const progressEntry = roleProgress.get(role)
    if (progressEntry) {
      progressEntry.sum += progress
      progressEntry.count += 1
    }

    if (assignment.status === 'completed') {
      incrementTrend(completionsByMonth, assignment.completed_at)
      roleCompletions.set(role, (roleCompletions.get(role) || 0) + 1)
    }

    const status =
      assignment.status === 'completed'
        ? 'completed'
        : progress > 0
          ? 'in_progress'
          : 'not_started'
    courseDistribution.set(status, (courseDistribution.get(status) || 0) + 1)
  })

  data.enrollments.forEach((enrollment) => {
    incrementTrend(enrollmentsByMonth, enrollment.enrolled_at || enrollment.started_at)
  })

  data.lessonProgress.forEach((progress) => {
    const minutes = progress.time_spent_minutes || 0
    const role = roleByUserId.get(progress.user_id) || 'member'
    const timeEntry = roleTime.get(role)
    if (timeEntry) {
      timeEntry.sum += minutes
      timeEntry.count += 1
    }

    incrementTrend(timeByMonth, progress.completed_at || progress.last_accessed_at, minutes)
  })

  data.dailyProgress.forEach((entry) => {
    if (!entry.had_activity) return

    const monthKey = entry.progress_date.slice(0, 7)
    const users = activeUsersByMonth.get(monthKey)
    if (users) {
      users.add(entry.user_id)
    } else {
      activeUsersByMonth.set(monthKey, new Set([entry.user_id]))
    }
  })

  const totalUsers = data.orgUsers.length
  const totalCoursesAssigned = data.assignments.length
  const completedCourses = data.assignments.filter(
    (assignment) => assignment.status === 'completed',
  ).length
  const averageProgress =
    totalCoursesAssigned > 0
      ? data.assignments.reduce(
          (sum, assignment) => sum + (assignment.completion_percentage || 0),
          0,
        ) / totalCoursesAssigned
      : 0
  const totalTimeMinutes = data.lessonProgress.reduce(
    (sum, progress) => sum + (progress.time_spent_minutes || 0),
    0,
  )
  const totalCertificates = data.certificates.length
  const activeUsers = data.orgUsers.filter((organizationUser) => {
    const lastLoginAt = getGlobalAnalyticsProfile(organizationUser)?.last_login_at
    if (!lastLoginAt) return false

    return new Date(lastLoginAt).getTime() >= getThirtyDaysAgoTimestamp(data.thirtyDaysAgoStr)
  }).length
  const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  const userAnalytics = buildGlobalUserAnalytics({
    orgUsers: data.orgUsers,
    enrollmentsByUserId,
    certificatesByUserId,
    lessonProgressByUserId,
    dailyProgressByUserId,
    studySessionsByUserId,
    studyPlanProgressByUserId,
    liaConversationsByUserId,
    liaMessagesByConversationId,
    userNotesByUserId,
  })

  const studyPlanner = buildStudyPlannerSection(data, userAnalytics)
  const teams = buildTeamSection(data, enrollmentsByUserId, lessonProgressByUserId, liaConversationsByUserId)

  return {
    success: true,
    general_metrics: {
      total_users: totalUsers,
      total_courses_assigned: totalCoursesAssigned,
      completed_courses: completedCourses,
      average_progress: roundToSingleDecimal(averageProgress),
      total_time_hours: roundToSingleDecimal(totalTimeMinutes / 60),
      total_certificates: totalCertificates,
      active_users: activeUsers,
      retention_rate: retentionRate,
    },
    user_analytics: userAnalytics,
    trends: {
      enrollments_by_month: formatTrends(enrollmentsByMonth),
      completions_by_month: formatTrends(completionsByMonth),
      time_by_month: formatTrends(timeByMonth).map((entry) => ({
        ...entry,
        count: roundToSingleDecimal(entry.count / 60),
      })),
      active_users_by_month: Array.from(activeUsersByMonth.entries())
        .map(([date, users]) => ({ date, count: users.size }))
        .sort((left, right) => left.date.localeCompare(right.date)),
    },
    by_role: {
      distribution: Array.from(roleDistribution.entries()).map(([role, count]) => ({
        role,
        count,
      })),
      progress_comparison: Array.from(roleProgress.entries()).map(([role, totals]) => ({
        role,
        average_progress:
          totals.count > 0 ? roundToSingleDecimal(totals.sum / totals.count) : 0,
      })),
      completions: Array.from(roleCompletions.entries()).map(([role, totalCompleted]) => ({
        role,
        total_completed: totalCompleted,
      })),
      time_spent: Array.from(roleTime.entries()).map(([role, totals]) => ({
        role,
        average_hours:
          totals.count > 0 ? roundToSingleDecimal(totals.sum / 60 / totals.count) : 0,
      })),
    },
    course_metrics: {
      distribution: Array.from(courseDistribution.entries()).map(([status, count]) => ({
        status,
        count,
      })),
      top_by_time: [],
    },
    study_planner: studyPlanner,
    engagement_metrics: {
      stickiness: calculateStickiness(data.dailyProgress),
      frequency: calculateFrequency(data.dailyProgress, data.thirtyDaysAgoStr),
      streaks: calculateStreaks(
        data.dailyProgress,
        data.orgUsers.map((organizationUser) => organizationUser.user_id),
      ),
      heatmap: calculateHeatmap(data.studySessions),
      duration: calculateDuration(data.studySessions, data.orgUsers),
    },
    teams,
  }
}

function buildStudyPlannerSection(
  data: GlobalAnalyticsQueryData,
  userAnalytics: BusinessAnalyticsApiResponse['user_analytics'],
) {
  const usersWithPlans = new Set(data.studyPlans.map((plan) => plan.user_id)).size
  const summary = summarizeStudySessions(data.studySessions)
  const planAdherenceRate =
    summary.totalSessions > 0
      ? Math.round((summary.completedSessions / summary.totalSessions) * 100)
      : 0

  return {
    users_with_plans: usersWithPlans,
    total_plans: data.studyPlans.length,
    total_sessions: summary.totalSessions,
    completed_sessions: summary.completedSessions,
    missed_sessions: summary.missedSessions,
    pending_sessions: summary.pendingSessions,
    in_progress_sessions: summary.inProgressSessions,
    ai_generated_sessions: summary.aiGeneratedSessions,
    sessions_by_status: summary.sessionsByStatus,
    usage_rate:
      data.orgUsers.length > 0 ? Math.round((usersWithPlans / data.orgUsers.length) * 100) : 0,
    average_session_duration_minutes: summary.averageSessionDurationMinutes,
    total_study_hours: summary.totalStudyHours,
    plan_adherence_rate: planAdherenceRate,
    on_time_completion_rate: planAdherenceRate,
    avg_sessions_per_user:
      data.orgUsers.length > 0 ? Math.round(summary.totalSessions / data.orgUsers.length) : 0,
    user_adherence: [...userAnalytics]
      .map((user) => ({
        user_id: user.user_id,
        name: user.display_name,
        email: user.email,
        adherence_rate: user.stats.planner.adherence,
        total_sessions: user.stats.planner.total_sessions,
        completed_sessions: user.stats.planner.completed_sessions,
      }))
      .filter((user) => user.total_sessions > 0 || user.completed_sessions > 0)
      .sort((left, right) => {
        if (right.adherence_rate !== left.adherence_rate) {
          return right.adherence_rate - left.adherence_rate
        }

        return right.total_sessions - left.total_sessions
      })
      .slice(0, 10),
  }
}

function buildTeamSection(
  data: GlobalAnalyticsQueryData,
  enrollmentsByUserId: Map<string, GlobalAnalyticsQueryData['enrollments'][number][]>,
  lessonProgressByUserId: Map<string, GlobalAnalyticsQueryData['lessonProgress'][number][]>,
  liaConversationsByUserId: Map<string, GlobalAnalyticsQueryData['liaConversations'][number][]>,
) {
  const teams = data.nodes.map((node) => {
    const memberIds = (node.organization_node_users || []).map((member) => member.user_id)
    const memberEnrollments = collectItemsForUsers(memberIds, enrollmentsByUserId)
    const memberLessonProgress = collectItemsForUsers(memberIds, lessonProgressByUserId)
    const memberLiaConversations = collectItemsForUsers(memberIds, liaConversationsByUserId)
    const teamSummary = summarizeTeamAnalytics(memberEnrollments, memberLessonProgress)

    return {
      team_id: node.id,
      name: node.name,
      description:
        typeof node.properties?.description === 'string'
          ? node.properties.description
          : null,
      image_url:
        typeof node.properties?.image_url === 'string' ? node.properties.image_url : null,
      member_count: memberIds.length,
      stats: {
        average_progress: teamSummary.averageProgress,
        courses_completed: teamSummary.completedCourses,
        total_enrollments: teamSummary.totalEnrollments,
        total_time_hours: teamSummary.totalTimeHours,
        lia_conversations: memberLiaConversations.length,
      },
    }
  })

  return {
    total_teams: teams.length,
    teams,
    ranking: [...teams].sort(
      (left, right) => right.stats.average_progress - left.stats.average_progress,
    ),
  }
}

function groupItemsByUserId<T extends { user_id: string }>(items: T[]) {
  return items.reduce((map, item) => {
    const groupedItems = map.get(item.user_id)
    if (groupedItems) {
      groupedItems.push(item)
    } else {
      map.set(item.user_id, [item])
    }
    return map
  }, new Map<string, T[]>())
}

function groupItemsByConversationId<T extends { conversation_id: string }>(items: T[]) {
  return items.reduce((map, item) => {
    const groupedItems = map.get(item.conversation_id)
    if (groupedItems) {
      groupedItems.push(item)
    } else {
      map.set(item.conversation_id, [item])
    }
    return map
  }, new Map<string, T[]>())
}

function collectItemsForUsers<T>(userIds: string[], groupedItems: Map<string, T[]>) {
  return userIds.flatMap((userId) => groupedItems.get(userId) || [])
}

function incrementTrend(
  trendMap: Map<string, number>,
  dateString: string | null | undefined,
  amount = 1,
) {
  if (!dateString) return

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return

  const monthKey = date.toISOString().slice(0, 7)
  trendMap.set(monthKey, (trendMap.get(monthKey) || 0) + amount)
}

function formatTrends(trendMap: Map<string, number>) {
  return Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100
}

function summarizeStudySessions(
  sessions: GlobalAnalyticsQueryData['studySessions'],
) {
  let completedSessions = 0
  let missedSessions = 0
  let pendingSessions = 0
  let inProgressSessions = 0
  let aiGeneratedSessions = 0
  let totalDurationMinutes = 0
  const sessionsByStatus = new Map<string, number>()

  for (const session of sessions) {
    const status = session.status || 'unknown'
    sessionsByStatus.set(status, (sessionsByStatus.get(status) || 0) + 1)

    if (status === 'completed') {
      completedSessions += 1
    } else if (status === 'missed') {
      missedSessions += 1
    } else if (status === 'pending') {
      pendingSessions += 1
    } else if (status === 'in_progress') {
      inProgressSessions += 1
    }

    if (session.is_ai_generated) {
      aiGeneratedSessions += 1
    }

    totalDurationMinutes += session.actual_duration_minutes || 0
  }

  return {
    totalSessions: sessions.length,
    completedSessions,
    missedSessions,
    pendingSessions,
    inProgressSessions,
    aiGeneratedSessions,
    averageSessionDurationMinutes:
      sessions.length > 0 ? roundToSingleDecimal(totalDurationMinutes / sessions.length) : 0,
    totalStudyHours: roundToSingleDecimal(totalDurationMinutes / 60),
    sessionsByStatus: Array.from(sessionsByStatus.entries()).map(([status, count]) => ({
      status,
      count,
    })),
  }
}

function summarizeTeamAnalytics(
  enrollments: GlobalAnalyticsQueryData['enrollments'],
  lessonProgress: GlobalAnalyticsQueryData['lessonProgress'],
) {
  let totalProgress = 0
  let completedCourses = 0

  for (const enrollment of enrollments) {
    totalProgress += enrollment.overall_progress_percentage || 0
    if (enrollment.enrollment_status === 'completed') {
      completedCourses += 1
    }
  }

  let totalTimeMinutes = 0
  for (const progress of lessonProgress) {
    totalTimeMinutes += progress.time_spent_minutes || 0
  }

  return {
    averageProgress:
      enrollments.length > 0 ? roundToSingleDecimal(totalProgress / enrollments.length) : 0,
    completedCourses,
    totalEnrollments: enrollments.length,
    totalTimeHours: roundToSingleDecimal(totalTimeMinutes / 60),
  }
}

function getThirtyDaysAgoTimestamp(thirtyDaysAgoStr: string) {
  return new Date(`${thirtyDaysAgoStr}T00:00:00.000Z`).getTime()
}
