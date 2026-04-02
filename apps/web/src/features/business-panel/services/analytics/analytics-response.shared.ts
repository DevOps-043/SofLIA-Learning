import type { BusinessAnalyticsApiResponse } from '../../types/analytics.types'

import type {
  BuildBusinessAnalyticsResponseInput,
  CourseAssignmentRecord,
  CourseCertificateRecord,
  CourseEnrollmentRecord,
  CourseRecord,
  DailyProgressRecord,
  LessonProgressRecord,
  LiaConversationRecord,
  LiaMessageRecord,
  OrganizationUserProfileRecord,
  OrganizationUserProfileRelation,
  StudySessionRecord,
  UserLessonNoteRecord,
} from './analytics-response.types'

export interface BusinessAnalyticsGroupedData {
  assignmentsByUserId: Map<string, CourseAssignmentRecord[]>
  lessonProgressByUserId: Map<string, LessonProgressRecord[]>
  certificatesByUserId: Map<string, CourseCertificateRecord[]>
  dailyProgressByUserId: Map<string, DailyProgressRecord[]>
  studySessionsByUserId: Map<string, StudySessionRecord[]>
  notesByUserId: Map<string, UserLessonNoteRecord[]>
  liaConversationsByUserId: Map<string, LiaConversationRecord[]>
  liaMessagesByUserId: Map<string, LiaMessageRecord[]>
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

export function createBusinessAnalyticsGroupedData(
  input: Pick<
    BuildBusinessAnalyticsResponseInput,
    | 'assignments'
    | 'certificates'
    | 'dailyProgress'
    | 'lessonProgress'
    | 'liaConversations'
    | 'liaMessages'
    | 'studySessions'
    | 'userNotes'
  >,
): BusinessAnalyticsGroupedData {
  return {
    assignmentsByUserId: groupItemsByUserId(input.assignments),
    lessonProgressByUserId: groupItemsByUserId(input.lessonProgress),
    certificatesByUserId: groupItemsByUserId(input.certificates),
    dailyProgressByUserId: groupItemsByUserId(input.dailyProgress),
    studySessionsByUserId: groupItemsByUserId(input.studySessions),
    notesByUserId: groupItemsByUserId(input.userNotes),
    liaConversationsByUserId: groupItemsByUserId(input.liaConversations),
    liaMessagesByUserId: groupItemsByUserId(input.liaMessages),
  }
}

export function createCourseNameMap(courses: CourseRecord[]): Map<string, string> {
  return courses.reduce((map, course) => {
    map.set(course.id, course.title || 'Curso sin titulo')
    return map
  }, new Map<string, string>())
}

export function groupItemsByUserId<T extends { user_id: string }>(items: T[]): Map<string, T[]> {
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

export function collectItemsForUsers<T>(
  userIds: string[],
  groupedItems: Map<string, T[]>,
): T[] {
  return userIds.flatMap((userId) => groupedItems.get(userId) || [])
}

export function createEnrollmentMap(
  enrollments: CourseEnrollmentRecord[],
): Map<string, CourseEnrollmentRecord> {
  return enrollments.reduce((map, enrollment) => {
    map.set(getEnrollmentKey(enrollment.user_id, enrollment.course_id), enrollment)
    return map
  }, new Map<string, CourseEnrollmentRecord>())
}

export function getEnrollmentKey(userId: string, courseId: string): string {
  return `${userId}_${courseId}`
}

export function getAssignmentProgress(
  assignment: CourseAssignmentRecord,
  enrollment: CourseEnrollmentRecord | undefined,
): number {
  return Number(enrollment?.overall_progress_percentage ?? assignment.completion_percentage ?? 0)
}

export function isAssignmentCompleted(
  assignment: CourseAssignmentRecord,
  enrollment: CourseEnrollmentRecord | undefined,
): boolean {
  return (
    assignment.status === 'completed' ||
    enrollment?.enrollment_status === 'completed' ||
    getAssignmentProgress(assignment, enrollment) >= 100
  )
}

export function getOrganizationUserProfile(
  relation: OrganizationUserProfileRelation,
): OrganizationUserProfileRecord | null {
  if (!relation) {
    return null
  }

  return Array.isArray(relation) ? relation[0] || null : relation
}

export function buildHourlyDistribution(studySessions: StudySessionRecord[]): number[] {
  const hours = new Array<number>(24).fill(0)

  studySessions.forEach((session) => {
    if (!session.start_time) {
      return
    }

    const startTime = new Date(session.start_time)
    if (Number.isNaN(startTime.getTime())) {
      return
    }

    hours[startTime.getHours()] += 1
  })

  return hours
}

export function getActivityCalendarLevel(
  hadActivity: boolean | null,
  studyMinutes: number | null,
): number {
  if (!hadActivity) {
    return 0
  }

  const minutes = studyMinutes || 0

  if (minutes <= 15) {
    return 1
  }

  if (minutes <= 45) {
    return 2
  }

  if (minutes <= 90) {
    return 3
  }

  return 4
}

export function processTrend(
  dateValue: string | null,
  trendMap: Map<string, number>,
  value: number = 1,
): void {
  if (!dateValue) {
    return
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return
  }

  const key = date.toISOString().slice(0, 7)
  trendMap.set(key, (trendMap.get(key) || 0) + value)
}

export function formatTrends(trendMap: Map<string, number>): Array<{ date: string; count: number }> {
  return Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-6)
}
