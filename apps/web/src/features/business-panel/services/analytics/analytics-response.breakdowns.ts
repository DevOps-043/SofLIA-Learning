import type { BusinessAnalyticsApiResponse } from '../../types/analytics.types'

import type {
  BuildBusinessAnalyticsResponseInput,
  CourseAssignmentRecord,
  CourseEnrollmentRecord,
} from './analytics-response.types'
import {
  collectItemsForUsers,
  formatTrends,
  getAssignmentProgress,
  getEnrollmentKey,
  isAssignmentCompleted,
  processTrend,
  type BusinessAnalyticsGroupedData,
} from './analytics-response.shared'

export function buildTeamAnalytics(input: {
  nodes: BuildBusinessAnalyticsResponseInput['nodes']
  assignmentsByUserId: BusinessAnalyticsGroupedData['assignmentsByUserId']
  lessonProgressByUserId: BusinessAnalyticsGroupedData['lessonProgressByUserId']
  enrollmentMap: Map<string, CourseEnrollmentRecord>
}): BusinessAnalyticsApiResponse['teams']['teams'] {
  return input.nodes.map((node) => {
    const memberIds = (node.organization_node_users || []).map((member) => member.user_id)
    const teamAssignments = collectItemsForUsers(memberIds, input.assignmentsByUserId)
    const teamLessonProgress = collectItemsForUsers(memberIds, input.lessonProgressByUserId)

    let teamProgressTotal = 0
    teamAssignments.forEach((assignment) => {
      teamProgressTotal += getAssignmentProgress(
        assignment,
        input.enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
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
            input.enrollmentMap.get(getEnrollmentKey(assignment.user_id, assignment.course_id)),
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
}

export function buildTrendBreakdowns(input: {
  orgUsers: BuildBusinessAnalyticsResponseInput['orgUsers']
  assignments: CourseAssignmentRecord[]
  enrollments: BuildBusinessAnalyticsResponseInput['enrollments']
  lessonProgress: BuildBusinessAnalyticsResponseInput['lessonProgress']
  dailyProgress: BuildBusinessAnalyticsResponseInput['dailyProgress']
  enrollmentMap: Map<string, CourseEnrollmentRecord>
}): Pick<BusinessAnalyticsApiResponse, 'trends' | 'by_role' | 'course_metrics'> {
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
    const enrollment = input.enrollmentMap.get(
      getEnrollmentKey(assignment.user_id, assignment.course_id),
    )
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
    if (!entry.had_activity) {
      return
    }

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
  }
}
