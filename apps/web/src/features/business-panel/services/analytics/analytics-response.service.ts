import type { BusinessAnalyticsApiResponse } from '../../types/analytics.types'
import {
  calculateDuration,
  calculateFrequency,
  calculateHeatmap,
  calculateStickiness,
  calculateStreaks,
} from './engagement-metrics.service'
import { buildBusinessAnalyticsSections } from './analytics-response.builders'
import {
  createBusinessAnalyticsGroupedData,
  createCourseNameMap,
  createEnrollmentMap,
  getEmptyBusinessAnalyticsResponse,
  getRelevantAnalyticsCourseIds,
} from './analytics-response.shared'
import type { BuildBusinessAnalyticsResponseInput } from './analytics-response.types'

export type {
  BuildBusinessAnalyticsResponseInput,
  CourseAssignmentRecord,
  CourseCertificateRecord,
  CourseEnrollmentRecord,
  CourseRecord,
  DailyProgressRecord,
  LessonProgressRecord,
  LiaConversationRecord,
  LiaMessageRecord,
  OrganizationNodeMemberRecord,
  OrganizationNodeRecord,
  OrganizationUserProfileRecord,
  OrganizationUserProfileRelation,
  OrganizationUserRecord,
  StudySessionRecord,
  UserLessonNoteRecord,
} from './analytics-response.types'

export { getEmptyBusinessAnalyticsResponse, getRelevantAnalyticsCourseIds }

export function buildBusinessAnalyticsResponse(
  input: BuildBusinessAnalyticsResponseInput,
): BusinessAnalyticsApiResponse {
  if (input.orgUsers.length === 0) {
    return getEmptyBusinessAnalyticsResponse()
  }

  const groupedData = createBusinessAnalyticsGroupedData(input)
  const enrollmentMap = createEnrollmentMap(input.enrollments)
  const courseNameMap = createCourseNameMap(input.courses)
  const sections = buildBusinessAnalyticsSections({
    courseNameMap,
    enrollmentMap,
    groupedData,
    input,
  })
  const userIds = input.orgUsers.map((user) => user.user_id)

  return {
    success: true,
    ...sections,
    engagement_metrics: {
      stickiness: calculateStickiness(input.dailyProgress),
      frequency: calculateFrequency(input.dailyProgress, input.thirtyDaysAgoStr),
      streaks: calculateStreaks(input.dailyProgress, userIds),
      heatmap: calculateHeatmap(input.studySessions),
      duration: calculateDuration(input.studySessions, input.orgUsers),
    },
  }
}
