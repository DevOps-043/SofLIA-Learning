import type { BusinessAnalyticsApiResponse } from '../../types/analytics.types'

import type { BuildBusinessAnalyticsResponseInput, CourseEnrollmentRecord } from './analytics-response.types'
import { buildTrendBreakdowns, buildTeamAnalytics } from './analytics-response.breakdowns'
import {
  getAssignmentProgress,
  getEnrollmentKey,
  isAssignmentCompleted,
  type BusinessAnalyticsGroupedData,
} from './analytics-response.shared'
import { buildUserAnalytics } from './analytics-response.user-metrics'

interface BuildBusinessAnalyticsSectionsInput {
  input: BuildBusinessAnalyticsResponseInput
  groupedData: BusinessAnalyticsGroupedData
  enrollmentMap: Map<string, CourseEnrollmentRecord>
  courseNameMap: Map<string, string>
}

type BusinessAnalyticsSections = Pick<
  BusinessAnalyticsApiResponse,
  'general_metrics' | 'user_analytics' | 'trends' | 'by_role' | 'course_metrics' | 'teams'
>

export function buildBusinessAnalyticsSections(
  input: BuildBusinessAnalyticsSectionsInput,
): BusinessAnalyticsSections {
  const { courseNameMap, enrollmentMap, groupedData } = input
  const totalUsers = input.input.orgUsers.length
  const totalAssignments = input.input.assignments.length
  const completedCourses = input.input.assignments.filter((assignment) =>
    isAssignmentCompleted(
      assignment,
      enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
    ),
  ).length

  let totalProgress = 0
  input.input.assignments.forEach((assignment) => {
    totalProgress += getAssignmentProgress(
      assignment,
      enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
    )
  })

  const averageProgress =
    totalAssignments > 0 ? Math.round((totalProgress / totalAssignments) * 100) / 100 : 0
  const totalTimeMinutes = input.input.lessonProgress.reduce(
    (sum, progress) => sum + (progress.time_spent_minutes || 0),
    0,
  )
  const totalCertificates = input.input.certificates.length
  const activeUserIds = new Set(
    input.input.dailyProgress
      .filter(
        (entry) => Boolean(entry.had_activity) && entry.progress_date >= input.input.thirtyDaysAgoStr,
      )
      .map((entry) => entry.user_id),
  )
  const activeUsers = activeUserIds.size
  const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  const userAnalytics = buildUserAnalytics({
    courseNameMap,
    enrollmentMap,
    groupedData,
    orgUsers: input.input.orgUsers,
  })

  const teamAnalytics = buildTeamAnalytics({
    assignmentsByUserId: groupedData.assignmentsByUserId,
    enrollmentMap,
    lessonProgressByUserId: groupedData.lessonProgressByUserId,
    nodes: input.input.nodes,
  })

  const trendBreakdowns = buildTrendBreakdowns({
    assignments: input.input.assignments,
    dailyProgress: input.input.dailyProgress,
    enrollments: input.input.enrollments,
    enrollmentMap,
    lessonProgress: input.input.lessonProgress,
    orgUsers: input.input.orgUsers,
  })

  return {
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
    trends: trendBreakdowns.trends,
    by_role: trendBreakdowns.by_role,
    course_metrics: trendBreakdowns.course_metrics,
    teams: {
      total_teams: input.input.nodes.length,
      teams: teamAnalytics,
      ranking: [...teamAnalytics].sort(
        (left, right) => right.stats.average_progress - left.stats.average_progress,
      ),
    },
  }
}
