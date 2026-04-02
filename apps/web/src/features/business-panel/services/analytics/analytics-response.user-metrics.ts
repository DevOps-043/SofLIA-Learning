import type { BusinessAnalyticsApiResponse } from '../../types/analytics.types'

import type { BuildBusinessAnalyticsResponseInput, CourseEnrollmentRecord } from './analytics-response.types'
import {
  buildHourlyDistribution,
  getActivityCalendarLevel,
  getAssignmentProgress,
  getEnrollmentKey,
  getOrganizationUserProfile,
  isAssignmentCompleted,
  type BusinessAnalyticsGroupedData,
} from './analytics-response.shared'

export function buildUserAnalytics(input: {
  orgUsers: BuildBusinessAnalyticsResponseInput['orgUsers']
  groupedData: BusinessAnalyticsGroupedData
  enrollmentMap: Map<string, CourseEnrollmentRecord>
  courseNameMap: Map<string, string>
}): BusinessAnalyticsApiResponse['user_analytics'] {
  return input.orgUsers.map((organizationUser) => {
    const userId = organizationUser.user_id
    const profile = getOrganizationUserProfile(organizationUser.users)
    const userAssignments = input.groupedData.assignmentsByUserId.get(userId) || []
    const userLessonProgress = input.groupedData.lessonProgressByUserId.get(userId) || []
    const userCertificates = input.groupedData.certificatesByUserId.get(userId) || []
    const userDailyProgress = input.groupedData.dailyProgressByUserId.get(userId) || []
    const userSessions = input.groupedData.studySessionsByUserId.get(userId) || []
    const userNotes = input.groupedData.notesByUserId.get(userId) || []
    const userConversations = input.groupedData.liaConversationsByUserId.get(userId) || []
    const userMessages = input.groupedData.liaMessagesByUserId.get(userId) || []

    let userProgressTotal = 0
    userAssignments.forEach((assignment) => {
      userProgressTotal += getAssignmentProgress(
        assignment,
        input.enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
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
        input.enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
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
          level: getActivityCalendarLevel(entry.had_activity, entry.study_minutes),
        })),
        hourly_distribution: buildHourlyDistribution(userSessions),
        courses: {
          total_lesson_time_minutes: userTotalTimeMinutes,
          lessons_completed: userLessonProgress.filter((progress) => progress.is_completed).length,
          quizzes_completed: userLessonProgress.filter((progress) => progress.quiz_completed).length,
          quizzes_passed: userLessonProgress.filter((progress) => progress.quiz_passed).length,
          notes_count: userNotes.length,
          breakdown: userAssignments.map((assignment) => {
            const enrollment = input.enrollmentMap.get(
              getEnrollmentKey(assignment.user_id, assignment.course_id),
            )
            const progress = getAssignmentProgress(assignment, enrollment)
            const completed = isAssignmentCompleted(assignment, enrollment)

            return {
              course_id: assignment.course_id,
              course_title: input.courseNameMap.get(assignment.course_id) || 'Curso sin titulo',
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
}
