import type { BusinessAnalyticsApiResponse } from '../../types/analytics.types'
import {
  calculateDuration,
  calculateFrequency,
  calculateHeatmap,
  calculateStickiness,
  calculateStreaks,
} from './engagement-metrics.service'

interface OrganizationUserProfileRecord {
  id: string
  username: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
  last_login_at: string | null
}

type OrganizationUserProfileRelation =
  | OrganizationUserProfileRecord
  | OrganizationUserProfileRecord[]
  | null

export interface OrganizationUserRecord {
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  job_title: string | null
  users: OrganizationUserProfileRelation
}

export interface CourseAssignmentRecord {
  id: string
  user_id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
}

export interface CourseEnrollmentRecord {
  enrollment_id: string
  user_id: string
  course_id: string
  overall_progress_percentage: number | null
  enrollment_status: string | null
  completed_at: string | null
  started_at: string | null
  enrolled_at?: string | null
}

export interface CourseCertificateRecord {
  certificate_id: string
  user_id: string
  course_id: string
  issued_at: string | null
}

export interface LessonProgressRecord {
  user_id: string
  lesson_id: string
  enrollment_id: string | null
  time_spent_minutes: number | null
  is_completed: boolean | null
  completed_at: string | null
  last_accessed_at: string | null
  quiz_completed: boolean | null
  quiz_passed: boolean | null
}

export interface DailyProgressRecord {
  user_id: string
  progress_date: string
  had_activity: boolean | null
  streak_count: number | null
  study_minutes: number | null
  sessions_completed: number | null
  sessions_missed: number | null
}

export interface StudySessionRecord {
  id: string
  user_id: string
  start_time: string | null
  actual_duration_minutes: number | null
  status: string | null
  completed_at: string | null
  session_type: string | null
}

export interface OrganizationNodeMemberRecord {
  user_id: string
}

export interface OrganizationNodeRecord {
  id: string
  name: string
  type: string | null
  properties: Record<string, unknown> | null
  organization_node_users: OrganizationNodeMemberRecord[] | null
}

export interface LiaConversationRecord {
  id: string
  user_id: string
  context_type: string | null
  created_at: string | null
}

export interface LiaMessageRecord {
  id: string
  conversation_id: string
  role: string | null
  user_id: string
}

export interface UserLessonNoteRecord {
  id: string
  user_id: string
}

export interface CourseRecord {
  id: string
  title: string | null
}

export interface BuildBusinessAnalyticsResponseInput {
  orgUsers: OrganizationUserRecord[]
  assignments: CourseAssignmentRecord[]
  enrollments: CourseEnrollmentRecord[]
  certificates: CourseCertificateRecord[]
  lessonProgress: LessonProgressRecord[]
  dailyProgress: DailyProgressRecord[]
  studySessions: StudySessionRecord[]
  nodes: OrganizationNodeRecord[]
  liaConversations: LiaConversationRecord[]
  liaMessages: LiaMessageRecord[]
  userNotes: UserLessonNoteRecord[]
  courses: CourseRecord[]
  thirtyDaysAgoStr: string
}

export function getEmptyBusinessAnalyticsResponse(): BusinessAnalyticsApiResponse {
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
    teams: {
      total_teams: 0,
      teams: [],
      ranking: [],
    },
    engagement_metrics: {
      stickiness: [],
      frequency: [],
      streaks: [],
      heatmap: [],
      duration: [],
    },
  }
}

export function getRelevantAnalyticsCourseIds(input: {
  assignments: CourseAssignmentRecord[]
  enrollments: CourseEnrollmentRecord[]
}): string[] {
  const courseIds = new Set<string>()

  input.assignments.forEach((assignment) => {
    if (assignment.course_id) {
      courseIds.add(assignment.course_id)
    }
  })

  input.enrollments.forEach((enrollment) => {
    if (enrollment.course_id) {
      courseIds.add(enrollment.course_id)
    }
  })

  return Array.from(courseIds)
}

export function buildBusinessAnalyticsResponse(
  input: BuildBusinessAnalyticsResponseInput,
): BusinessAnalyticsApiResponse {
  if (input.orgUsers.length === 0) {
    return getEmptyBusinessAnalyticsResponse()
  }

  const totalUsers = input.orgUsers.length
  const userIds = input.orgUsers.map((user) => user.user_id)
  const enrollmentMap = createEnrollmentMap(input.enrollments)
  const assignmentsByUserId = groupItemsByUserId(input.assignments)
  const lessonProgressByUserId = groupItemsByUserId(input.lessonProgress)
  const certificatesByUserId = groupItemsByUserId(input.certificates)
  const dailyProgressByUserId = groupItemsByUserId(input.dailyProgress)
  const studySessionsByUserId = groupItemsByUserId(input.studySessions)
  const notesByUserId = groupItemsByUserId(input.userNotes)
  const liaConversationsByUserId = groupItemsByUserId(input.liaConversations)
  const liaMessagesByUserId = groupItemsByUserId(input.liaMessages)
  const courseNameMap = new Map<string, string>()

  input.courses.forEach((course) => {
    courseNameMap.set(course.id, course.title || 'Curso sin título')
  })

  const totalAssignments = input.assignments.length
  const completedCourses = input.assignments.filter((assignment) =>
    isAssignmentCompleted(assignment, enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id))),
  ).length

  let totalProgress = 0
  input.assignments.forEach((assignment) => {
    totalProgress += getAssignmentProgress(
      assignment,
      enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
    )
  })

  const averageProgress =
    totalAssignments > 0 ? Math.round((totalProgress / totalAssignments) * 100) / 100 : 0
  const totalTimeMinutes = input.lessonProgress.reduce(
    (sum, progress) => sum + (progress.time_spent_minutes || 0),
    0,
  )
  const totalCertificates = input.certificates.length
  const activeUserIds = new Set(
    input.dailyProgress
      .filter(
        (entry) => Boolean(entry.had_activity) && entry.progress_date >= input.thirtyDaysAgoStr,
      )
      .map((entry) => entry.user_id),
  )
  const activeUsers = activeUserIds.size
  const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  const userAnalytics = input.orgUsers.map((organizationUser) => {
    const userId = organizationUser.user_id
    const profile = getOrganizationUserProfile(organizationUser.users)
    const userAssignments = assignmentsByUserId.get(userId) || []
    const userLessonProgress = lessonProgressByUserId.get(userId) || []
    const userCertificates = certificatesByUserId.get(userId) || []
    const userDailyProgress = dailyProgressByUserId.get(userId) || []
    const userSessions = studySessionsByUserId.get(userId) || []
    const userNotes = notesByUserId.get(userId) || []
    const userConversations = liaConversationsByUserId.get(userId) || []
    const userMessages = liaMessagesByUserId.get(userId) || []

    let userProgressTotal = 0
    userAssignments.forEach((assignment) => {
      userProgressTotal += getAssignmentProgress(
        assignment,
        enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
      )
    })

    const userAverageProgress =
      userAssignments.length > 0
        ? Math.round((userProgressTotal / userAssignments.length) * 100) / 100
        : 0
    const userTotalTimeMinutes = userLessonProgress.reduce(
      (sum, progress) => sum + (progress.time_spent_minutes || 0),
      0,
    )
    const userCoursesCompleted = userAssignments.filter((assignment) =>
      isAssignmentCompleted(
        assignment,
        enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
      ),
    ).length
    const latestDailyProgress = userDailyProgress[0] || null
    const currentStreak = latestDailyProgress?.streak_count || 0
    const totalSessions = userSessions.length
    const completedSessions = userSessions.filter(
      (session) => session.status === 'completed',
    ).length
    const adherence =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
    const lastActivity = userDailyProgress[0]?.progress_date || profile?.last_login_at || null
    const fullName =
      profile?.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : null

    return {
      user_id: userId,
      display_name:
        profile?.display_name ||
        profile?.first_name ||
        profile?.email?.split('@')[0] ||
        'Usuario',
      name: fullName,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      email: profile?.email || '',
      username: profile?.username || '',
      role: organizationUser.job_title || organizationUser.role || 'member',
      profile_picture_url: profile?.profile_picture_url || null,
      courses_assigned: userAssignments.length,
      courses_completed: userCoursesCompleted,
      average_progress: userAverageProgress,
      total_time_hours: Math.round((userTotalTimeMinutes / 60) * 100) / 100,
      total_time_minutes: userTotalTimeMinutes,
      certificates_count: userCertificates.length,
      last_login_at: profile?.last_login_at || null,
      last_active: lastActivity,
      joined_at: organizationUser.joined_at,
      stats: {
        current_streak: currentStreak,
        planner: {
          adherence,
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          completed: completedSessions,
          pending: totalSessions - completedSessions,
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
        hourly_distribution: buildHourlyDistribution(userSessions),
        courses: {
          total_lesson_time_minutes: userTotalTimeMinutes,
          lessons_completed: userLessonProgress.filter((progress) => progress.is_completed).length,
          quizzes_completed: userLessonProgress.filter((progress) => progress.quiz_completed).length,
          quizzes_passed: userLessonProgress.filter((progress) => progress.quiz_passed).length,
          notes_count: userNotes.length,
          breakdown: userAssignments.map((assignment) => {
            const enrollment = enrollmentMap.get(
              getEnrollmentKey(assignment.user_id, assignment.course_id),
            )
            const progress = getAssignmentProgress(assignment, enrollment)
            const completed = isAssignmentCompleted(assignment, enrollment)

            return {
              course_id: assignment.course_id,
              course_title: courseNameMap.get(assignment.course_id) || 'Curso sin título',
              progress,
              status: completed ? 'completed' : progress > 0 ? 'active' : 'enrolled',
            }
          }),
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
              (conversation) => conversation.context_type === 'course',
            ).length,
          },
        },
      },
    }
  })

  const teamAnalytics = input.nodes.map((node) => {
    const memberIds = (node.organization_node_users || []).map((member) => member.user_id)
    const teamAssignments = collectItemsForUsers(memberIds, assignmentsByUserId)
    const teamLessonProgress = collectItemsForUsers(memberIds, lessonProgressByUserId)

    let teamProgressTotal = 0
    teamAssignments.forEach((assignment) => {
      teamProgressTotal += getAssignmentProgress(
        assignment,
        enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
      )
    })

    const properties = node.properties || {}
    const description =
      typeof properties.description === 'string' ? properties.description : null
    const imageUrl = typeof properties.image_url === 'string' ? properties.image_url : null

    return {
      team_id: node.id,
      name: node.name,
      description,
      image_url: imageUrl,
      member_count: memberIds.length,
      stats: {
        average_progress:
          teamAssignments.length > 0
            ? Math.round((teamProgressTotal / teamAssignments.length) * 100) / 100
            : 0,
        courses_completed: teamAssignments.filter((assignment) =>
          isAssignmentCompleted(
            assignment,
            enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
          ),
        ).length,
        total_enrollments: teamAssignments.length,
        total_time_hours:
          Math.round(
            (teamLessonProgress.reduce(
              (sum, progress) => sum + (progress.time_spent_minutes || 0),
              0,
            ) /
              60) *
              100,
          ) / 100,
        lia_conversations: 0,
      },
    }
  })

  const enrollmentsByMonth = new Map<string, number>()
  const completionsByMonth = new Map<string, number>()
  const timeByMonth = new Map<string, number>()
  const activeUsersByMonth = new Map<string, number>()
  const roleDistribution = new Map<string, number>()
  const roleProgress = new Map<string, { sum: number; count: number }>()
  const roleCompletions = new Map<string, number>()
  const roleTime = new Map<string, { sum: number; count: number }>()
  const courseDistribution = new Map<string, number>()
  const userRoleMap = new Map<string, string>()

  input.orgUsers.forEach((user) => {
    const role = user.job_title || user.role || 'member'
    userRoleMap.set(user.user_id, role)
    roleDistribution.set(role, (roleDistribution.get(role) || 0) + 1)

    if (!roleProgress.has(role)) {
      roleProgress.set(role, { sum: 0, count: 0 })
    }

    if (!roleCompletions.has(role)) {
      roleCompletions.set(role, 0)
    }

    if (!roleTime.has(role)) {
      roleTime.set(role, { sum: 0, count: 0 })
    }
  })

  input.assignments.forEach((assignment) => {
    const enrollment = enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id))
    const progress = getAssignmentProgress(assignment, enrollment)
    const role = userRoleMap.get(assignment.user_id) || 'member'
    const completed = isAssignmentCompleted(assignment, enrollment)

    if (completed) {
      processTrend(assignment.completed_at || enrollment?.completed_at || null, completionsByMonth)
      roleCompletions.set(role, (roleCompletions.get(role) || 0) + 1)
    }

    const roleProgressEntry = roleProgress.get(role)
    if (roleProgressEntry) {
      roleProgressEntry.sum += progress
      roleProgressEntry.count += 1
    }

    const status = completed ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
    courseDistribution.set(status, (courseDistribution.get(status) || 0) + 1)
  })

  input.enrollments.forEach((enrollment) => {
    processTrend(enrollment.started_at || enrollment.enrolled_at || null, enrollmentsByMonth)
  })

  input.lessonProgress.forEach((progress) => {
    const minutes = progress.time_spent_minutes || 0
    const role = userRoleMap.get(progress.user_id) || 'member'
    const roleTimeEntry = roleTime.get(role)

    if (roleTimeEntry) {
      roleTimeEntry.sum += minutes
      roleTimeEntry.count += 1
    }

    processTrend(progress.completed_at || progress.last_accessed_at || null, timeByMonth, minutes)
  })

  const monthlyActiveUsers = new Map<string, Set<string>>()
  input.dailyProgress.forEach((entry) => {
    if (!entry.had_activity) return

    const key = entry.progress_date.slice(0, 7)
    if (!monthlyActiveUsers.has(key)) {
      monthlyActiveUsers.set(key, new Set())
    }

    monthlyActiveUsers.get(key)?.add(entry.user_id)
  })
  monthlyActiveUsers.forEach((users, key) => {
    activeUsersByMonth.set(key, users.size)
  })

  return {
    success: true,
    general_metrics: {
      total_users: totalUsers,
      total_courses_assigned: totalAssignments,
      completed_courses: completedCourses,
      average_progress: averageProgress,
      total_time_hours: Math.round((totalTimeMinutes / 60) * 100) / 100,
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
        count: Math.round((entry.count / 60) * 10) / 10,
      })),
      active_users_by_month: formatTrends(activeUsersByMonth),
    },
    by_role: {
      distribution: Array.from(roleDistribution.entries()).map(([role, count]) => ({
        role,
        count,
      })),
      progress_comparison: Array.from(roleProgress.entries()).map(([role, totals]) => ({
        role,
        average_progress:
          totals.count > 0 ? Math.round((totals.sum / totals.count) * 10) / 10 : 0,
      })),
      completions: Array.from(roleCompletions.entries()).map(([role, count]) => ({
        role,
        total_completed: count,
      })),
      time_spent: Array.from(roleTime.entries()).map(([role, totals]) => ({
        role,
        average_hours:
          totals.count > 0 ? Math.round((totals.sum / 60 / totals.count) * 10) / 10 : 0,
      })),
    },
    course_metrics: {
      distribution: Array.from(courseDistribution.entries()).map(([status, count]) => ({
        status,
        count,
      })),
      top_by_time: [],
    },
    teams: {
      total_teams: input.nodes.length,
      teams: teamAnalytics,
      ranking: [...teamAnalytics].sort(
        (left, right) => right.stats.average_progress - left.stats.average_progress,
      ),
    },
    engagement_metrics: {
      stickiness: calculateStickiness(input.dailyProgress),
      frequency: calculateFrequency(input.dailyProgress, input.thirtyDaysAgoStr),
      streaks: calculateStreaks(input.dailyProgress, userIds),
      heatmap: calculateHeatmap(input.studySessions),
      duration: calculateDuration(input.studySessions, input.orgUsers),
    },
  }
}

function groupItemsByUserId<T extends { user_id: string }>(items: T[]): Map<string, T[]> {
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

function collectItemsForUsers<T>(
  userIds: string[],
  groupedItems: Map<string, T[]>,
): T[] {
  return userIds.flatMap((userId) => groupedItems.get(userId) || [])
}

function createEnrollmentMap(
  enrollments: CourseEnrollmentRecord[],
): Map<string, CourseEnrollmentRecord> {
  return enrollments.reduce((map, enrollment) => {
    map.set(getEnrollmentKey(enrollment.user_id, enrollment.course_id), enrollment)
    return map
  }, new Map<string, CourseEnrollmentRecord>())
}

function getEnrollmentKey(userId: string, courseId: string): string {
  return `${userId}_${courseId}`
}

function getAssignmentProgress(
  assignment: CourseAssignmentRecord,
  enrollment: CourseEnrollmentRecord | undefined,
): number {
  return Number(enrollment?.overall_progress_percentage ?? assignment.completion_percentage ?? 0)
}

function isAssignmentCompleted(
  assignment: CourseAssignmentRecord,
  enrollment: CourseEnrollmentRecord | undefined,
): boolean {
  return (
    assignment.status === 'completed' ||
    enrollment?.enrollment_status === 'completed' ||
    getAssignmentProgress(assignment, enrollment) >= 100
  )
}

function getOrganizationUserProfile(
  relation: OrganizationUserProfileRelation,
): OrganizationUserProfileRecord | null {
  if (!relation) return null
  return Array.isArray(relation) ? relation[0] || null : relation
}

function buildHourlyDistribution(studySessions: StudySessionRecord[]): number[] {
  const hours = new Array<number>(24).fill(0)

  studySessions.forEach((session) => {
    if (!session.start_time) return

    const startTime = new Date(session.start_time)
    if (Number.isNaN(startTime.getTime())) return

    hours[startTime.getHours()] += 1
  })

  return hours
}

function processTrend(
  dateValue: string | null,
  trendMap: Map<string, number>,
  value: number = 1,
): void {
  if (!dateValue) return

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return

  const key = date.toISOString().slice(0, 7)
  trendMap.set(key, (trendMap.get(key) || 0) + value)
}

function formatTrends(trendMap: Map<string, number>): Array<{ date: string; count: number }> {
  return Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-6)
}
