import type {
  AnalyticsCourseAssignmentRecord,
  AnalyticsCourseEnrollmentRecord,
  AnalyticsOrganizationNodeRecord,
  AnalyticsTrendData,
  AnalyticsUserProfileRecord,
  AnalyticsUserProfileRelation,
} from './analytics.types'

export function getUserProfile(
  relation: AnalyticsUserProfileRelation,
): AnalyticsUserProfileRecord | null {
  if (!relation) return null
  return Array.isArray(relation) ? relation[0] ?? null : relation
}

export function groupByUserId<T extends { user_id: string }>(items: T[]) {
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

export function buildEnrollmentKey(userId: string, courseId: string) {
  return `${userId}:${courseId}`
}

export function buildEnrollmentMap(enrollments: AnalyticsCourseEnrollmentRecord[]) {
  return enrollments.reduce((map, enrollment) => {
    map.set(buildEnrollmentKey(enrollment.user_id, enrollment.course_id), enrollment)
    return map
  }, new Map<string, AnalyticsCourseEnrollmentRecord>())
}

export function getAssignmentProgress(
  assignment: AnalyticsCourseAssignmentRecord,
  enrollmentMap: Map<string, AnalyticsCourseEnrollmentRecord>,
) {
  return Number(
    enrollmentMap.get(buildEnrollmentKey(assignment.user_id, assignment.course_id))
      ?.overall_progress_percentage ??
      assignment.completion_percentage ??
      0,
  )
}

export function isAssignmentCompleted(
  assignment: AnalyticsCourseAssignmentRecord,
  enrollmentMap: Map<string, AnalyticsCourseEnrollmentRecord>,
) {
  const enrollment = enrollmentMap.get(
    buildEnrollmentKey(assignment.user_id, assignment.course_id),
  )
  return (
    assignment.status === 'completed' ||
    enrollment?.enrollment_status === 'completed' ||
    getAssignmentProgress(assignment, enrollmentMap) >= 100
  )
}

export function processTrend(
  value: string | null,
  targetMap: Map<string, number>,
  count = 1,
) {
  if (!value) return
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return
  const key = date.toISOString().slice(0, 7)
  targetMap.set(key, (targetMap.get(key) ?? 0) + count)
}

export function formatTrendMap(map: Map<string, number>): AnalyticsTrendData[] {
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-6)
}

export function getTeamMetadata(node: AnalyticsOrganizationNodeRecord) {
  const properties =
    node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)
      ? node.properties
      : {}
  return {
    description: typeof properties.description === 'string' ? properties.description : null,
    image_url: typeof properties.image_url === 'string' ? properties.image_url : null,
  }
}
