import {
  getAssignmentProgress,
  getUserProfile,
  isAssignmentCompleted,
} from './analytics-aggregation.utils'
import { getLastActive, getLatestStreak } from './analytics-metrics.utils'
import { roundToTwoDecimals, roundToWhole } from './analytics-math.utils'
import type { AnalyticsTransformContext } from './analytics-transform-context.utils'
import type { AnalyticsOrganizationUserRecord, AnalyticsUser } from './analytics.types'

export function buildUserAnalyticsEntry(
  orgUser: AnalyticsOrganizationUserRecord,
  context: AnalyticsTransformContext,
): AnalyticsUser {
  const profile = getUserProfile(orgUser.users)
  const assignments = context.assignmentsByUser.get(orgUser.user_id) ?? []
  const certificates = context.certificatesByUser.get(orgUser.user_id) ?? []
  const lessons = context.lessonProgressByUser.get(orgUser.user_id) ?? []
  const dailyProgress = context.dailyProgressByUser.get(orgUser.user_id) ?? []
  const sessions = context.studySessionsByUser.get(orgUser.user_id) ?? []
  const totalProgress = assignments.reduce(
    (sum, assignment) =>
      sum + getAssignmentProgress(assignment, context.enrollmentMap),
    0,
  )
  const totalTimeMinutes = lessons.reduce(
    (sum, lesson) => sum + (lesson.time_spent_minutes ?? 0),
    0,
  )
  const completedSessions = sessions.filter(
    (session) => session.status === 'completed',
  ).length
  const totalSessions = sessions.length

  return {
    user_id: orgUser.user_id,
    display_name: getDisplayName(profile),
    email: profile?.email ?? '',
    username: profile?.username ?? '',
    role: orgUser.job_title || orgUser.role || 'member',
    profile_picture_url: profile?.profile_picture_url ?? null,
    courses_assigned: assignments.length,
    courses_completed: assignments.filter((assignment) =>
      isAssignmentCompleted(assignment, context.enrollmentMap),
    ).length,
    average_progress:
      assignments.length > 0 ? roundToTwoDecimals(totalProgress / assignments.length) : 0,
    total_time_hours: roundToTwoDecimals(totalTimeMinutes / 60),
    total_time_minutes: totalTimeMinutes,
    certificates_count: certificates.length,
    last_login_at: profile?.last_login_at ?? null,
    last_active: getLastActive(dailyProgress) ?? profile?.last_login_at ?? null,
    joined_at: orgUser.joined_at,
    stats: {
      current_streak: getLatestStreak(dailyProgress),
      planner: {
        adherence:
          totalSessions > 0 ? roundToWhole((completedSessions / totalSessions) * 100) : 0,
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        pending_sessions: totalSessions - completedSessions,
      },
      courses: {
        total_lesson_time_minutes: totalTimeMinutes,
        lessons_completed: lessons.filter((lesson) => lesson.is_completed).length,
        quizzes_completed: lessons.filter((lesson) => lesson.quiz_completed).length,
        quizzes_passed: lessons.filter((lesson) => lesson.quiz_passed).length,
      },
    },
  }
}

function getDisplayName(profile: ReturnType<typeof getUserProfile>) {
  return (
    profile?.display_name ||
    profile?.first_name ||
    profile?.email?.split('@')[0] ||
    'Usuario'
  )
}
