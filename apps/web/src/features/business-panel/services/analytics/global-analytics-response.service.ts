import type {
  BusinessAnalyticsApiResponse,
  BusinessAnalyticsCourseBreakdownItem,
} from '../../types/analytics.types'
import {
  calculateDuration,
  calculateFrequency,
  calculateHeatmap,
  calculateStickiness,
  calculateStreaks,
} from './engagement-metrics.service'
import type { GlobalAnalyticsQueryData } from './global-analytics-query.service'

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
    const lastLoginAt = getProfile(organizationUser)?.last_login_at
    if (!lastLoginAt) return false

    return new Date(lastLoginAt).getTime() >= getThirtyDaysAgoTimestamp(data.thirtyDaysAgoStr)
  }).length
  const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  const userAnalytics = data.orgUsers.map((organizationUser) => {
    const profile = getProfile(organizationUser)
    const userEnrollments = enrollmentsByUserId.get(organizationUser.user_id) || []
    const userCertificates = certificatesByUserId.get(organizationUser.user_id) || []
    const userLessonProgress = lessonProgressByUserId.get(organizationUser.user_id) || []
    const userDailyProgress = sortDailyProgress(
      dailyProgressByUserId.get(organizationUser.user_id) || [],
    )
    const userStudySessions = studySessionsByUserId.get(organizationUser.user_id) || []
    const userPlanProgress = studyPlanProgressByUserId.get(organizationUser.user_id) || []
    const userConversations = liaConversationsByUserId.get(organizationUser.user_id) || []
    const userNotes = userNotesByUserId.get(organizationUser.user_id) || []
    const userMessages = userConversations.flatMap(
      (conversation) => liaMessagesByConversationId.get(conversation.id) || [],
    )
    const userAverageProgress =
      userEnrollments.length > 0
        ? userEnrollments.reduce(
            (sum, enrollment) => sum + (enrollment.overall_progress_percentage || 0),
            0,
          ) / userEnrollments.length
        : 0
    const userTimeMinutes = userLessonProgress.reduce(
      (sum, progress) => sum + (progress.time_spent_minutes || 0),
      0,
    )
    const totalPlannedSessions = userPlanProgress.reduce(
      (sum, progress) => sum + (progress.total_sessions || 0),
      0,
    )
    const completedPlannedSessions = userPlanProgress.reduce(
      (sum, progress) => sum + (progress.sessions_completed || 0),
      0,
    )
    const pendingPlannedSessions = userPlanProgress.reduce(
      (sum, progress) => sum + (progress.sessions_pending || 0),
      0,
    )
    const currentStreak = userDailyProgress[0]?.streak_count || 0
    const courseBreakdown: BusinessAnalyticsCourseBreakdownItem[] = userEnrollments.map(
      (enrollment) => {
        const status: BusinessAnalyticsCourseBreakdownItem['status'] =
          enrollment.enrollment_status === 'completed'
            ? 'completed'
            : (enrollment.overall_progress_percentage || 0) > 0
              ? 'active'
              : 'enrolled'

        return {
          course_id: enrollment.course_id,
          course_title: getEnrollmentCourseTitle(enrollment),
          progress: enrollment.overall_progress_percentage || 0,
          status,
        }
      },
    )

    return {
      user_id: organizationUser.user_id,
      display_name:
        profile?.display_name ||
        profile?.first_name ||
        profile?.email?.split('@')[0] ||
        'Usuario',
      name:
        profile?.first_name || profile?.last_name
          ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
          : null,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      email: profile?.email || '',
      username: profile?.username || '',
      role: organizationUser.job_title || organizationUser.role || 'member',
      profile_picture_url: profile?.profile_picture_url || null,
      courses_assigned: userEnrollments.length,
      courses_completed: userEnrollments.filter(
        (enrollment) => enrollment.enrollment_status === 'completed',
      ).length,
      average_progress: roundToSingleDecimal(userAverageProgress),
      total_time_hours: roundToTwoDecimals(userTimeMinutes / 60),
      total_time_minutes: userTimeMinutes,
      certificates_count: userCertificates.length,
      last_login_at: profile?.last_login_at || null,
      last_active: userDailyProgress[0]?.progress_date || profile?.last_login_at || null,
      joined_at: organizationUser.joined_at,
      stats: {
        current_streak: currentStreak,
        planner: {
          adherence:
            totalPlannedSessions > 0
              ? Math.round((completedPlannedSessions / totalPlannedSessions) * 100)
              : 0,
          total_sessions: totalPlannedSessions || userStudySessions.length,
          completed_sessions: completedPlannedSessions,
          completed: completedPlannedSessions,
          pending: pendingPlannedSessions,
        },
        activity_calendar: userDailyProgress.map((entry) => ({
          date: entry.progress_date,
          count: entry.study_minutes || 0,
          level: !entry.had_activity
            ? 0
            : (entry.study_minutes || 0) <= 15
              ? 1
              : (entry.study_minutes || 0) <= 45
                ? 2
                : (entry.study_minutes || 0) <= 90
                  ? 3
                  : 4,
        })),
        hourly_distribution: buildHourlyDistribution(userStudySessions),
        courses: {
          total_lesson_time_minutes: userTimeMinutes,
          lessons_started: userLessonProgress.filter((progress) => progress.started_at).length,
          lessons_completed: userLessonProgress.filter((progress) => progress.is_completed).length,
          quizzes_completed: userLessonProgress.filter((progress) => progress.quiz_completed).length,
          quizzes_passed: userLessonProgress.filter((progress) => progress.quiz_passed).length,
          notes_count: userNotes.length,
          notes_auto_generated: userNotes.filter((note) => note.is_auto_generated).length,
          breakdown: courseBreakdown,
        },
        lia: {
          total_conversations: userConversations.length,
          total_messages: userMessages.length,
          user_messages: userMessages.filter((message) => message.role === 'user').length,
          assistant_responses: userMessages.filter(
            (message) => message.role === 'assistant',
          ).length,
          contexts: {
            ai_chat: userConversations.filter(
              (conversation) =>
                conversation.context_type === 'ai_chat' || !conversation.context_type,
            ).length,
            course: userConversations.filter(
              (conversation) => conversation.context_type?.includes('course'),
            ).length,
          },
        },
      },
    }
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
  const totalSessions = data.studySessions.length
  const completedSessions = data.studySessions.filter(
    (session) => session.status === 'completed',
  ).length
  const missedSessions = data.studySessions.filter((session) => session.status === 'missed').length
  const pendingSessions = data.studySessions.filter((session) => session.status === 'pending').length
  const inProgressSessions = data.studySessions.filter(
    (session) => session.status === 'in_progress',
  ).length
  const aiGeneratedSessions = data.studySessions.filter(
    (session) => session.is_ai_generated,
  ).length
  const averageSessionDurationMinutes =
    data.studySessions.length > 0
      ? roundToSingleDecimal(
          data.studySessions.reduce(
            (sum, session) => sum + (session.actual_duration_minutes || 0),
            0,
          ) / data.studySessions.length,
        )
      : 0
  const totalStudyHours = roundToSingleDecimal(
    data.studySessions.reduce(
      (sum, session) => sum + (session.actual_duration_minutes || 0),
      0,
    ) / 60,
  )
  const planAdherenceRate =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  return {
    users_with_plans: usersWithPlans,
    total_plans: data.studyPlans.length,
    total_sessions: totalSessions,
    completed_sessions: completedSessions,
    missed_sessions: missedSessions,
    pending_sessions: pendingSessions,
    in_progress_sessions: inProgressSessions,
    ai_generated_sessions: aiGeneratedSessions,
    sessions_by_status: Array.from(
      data.studySessions.reduce((map, session) => {
        const status = session.status || 'unknown'
        map.set(status, (map.get(status) || 0) + 1)
        return map
      }, new Map<string, number>()),
    ).map(([status, count]) => ({ status, count })),
    usage_rate:
      data.orgUsers.length > 0 ? Math.round((usersWithPlans / data.orgUsers.length) * 100) : 0,
    average_session_duration_minutes: averageSessionDurationMinutes,
    total_study_hours: totalStudyHours,
    plan_adherence_rate: planAdherenceRate,
    on_time_completion_rate: planAdherenceRate,
    avg_sessions_per_user:
      data.orgUsers.length > 0 ? Math.round(totalSessions / data.orgUsers.length) : 0,
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
    const teamProgressAverage =
      memberEnrollments.length > 0
        ? memberEnrollments.reduce(
            (sum, enrollment) => sum + (enrollment.overall_progress_percentage || 0),
            0,
          ) / memberEnrollments.length
        : 0

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
        average_progress: roundToSingleDecimal(teamProgressAverage),
        courses_completed: memberEnrollments.filter(
          (enrollment) => enrollment.enrollment_status === 'completed',
        ).length,
        total_enrollments: memberEnrollments.length,
        total_time_hours: roundToSingleDecimal(
          memberLessonProgress.reduce(
            (sum, progress) => sum + (progress.time_spent_minutes || 0),
            0,
          ) / 60,
        ),
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

function getProfile(user: GlobalAnalyticsQueryData['orgUsers'][number]) {
  const relation = user.users
  if (Array.isArray(relation)) return relation[0] || null
  return relation || null
}

function getEnrollmentCourseTitle(enrollment: GlobalAnalyticsQueryData['enrollments'][number]) {
  const relation = enrollment.courses
  if (Array.isArray(relation)) return relation[0]?.title || 'Curso'
  return relation?.title || 'Curso'
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

function sortDailyProgress(records: GlobalAnalyticsQueryData['dailyProgress']) {
  return [...records].sort((left, right) => right.progress_date.localeCompare(left.progress_date))
}

function buildHourlyDistribution(
  sessions: GlobalAnalyticsQueryData['studySessions'],
): number[] {
  const distribution = new Array(24).fill(0)

  sessions.forEach((session) => {
    if (!session.start_time) return

    const date = new Date(session.start_time)
    if (Number.isNaN(date.getTime())) return
    distribution[date.getHours()] += 1
  })

  return distribution
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

function getThirtyDaysAgoTimestamp(thirtyDaysAgoStr: string) {
  return new Date(`${thirtyDaysAgoStr}T00:00:00.000Z`).getTime()
}
