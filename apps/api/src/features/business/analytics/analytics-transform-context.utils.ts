import {
  buildEnrollmentMap,
  groupByUserId,
} from './analytics-aggregation.utils'
import type {
  AnalyticsCourseAssignmentRecord,
  AnalyticsCourseCertificateRecord,
  AnalyticsCourseEnrollmentRecord,
  AnalyticsDailyProgressRecord,
  AnalyticsLessonProgressRecord,
  AnalyticsSourceData,
  AnalyticsStudySessionRecord,
} from './analytics.types'

export interface AnalyticsTransformContext {
  enrollmentMap: Map<string, AnalyticsCourseEnrollmentRecord>
  assignmentsByUser: Map<string, AnalyticsCourseAssignmentRecord[]>
  certificatesByUser: Map<string, AnalyticsCourseCertificateRecord[]>
  lessonProgressByUser: Map<string, AnalyticsLessonProgressRecord[]>
  dailyProgressByUser: Map<string, AnalyticsDailyProgressRecord[]>
  studySessionsByUser: Map<string, AnalyticsStudySessionRecord[]>
  activeUserIds: Set<string>
}

export function buildAnalyticsTransformContext(
  source: AnalyticsSourceData,
): AnalyticsTransformContext {
  return {
    enrollmentMap: buildEnrollmentMap(source.enrollments),
    assignmentsByUser: groupByUserId(source.assignments),
    certificatesByUser: groupByUserId(source.certificates),
    lessonProgressByUser: groupByUserId(source.lessonProgress),
    dailyProgressByUser: groupByUserId(source.dailyProgress),
    studySessionsByUser: groupByUserId(source.studySessions),
    activeUserIds: buildActiveUserIds(source),
  }
}

function buildActiveUserIds(source: AnalyticsSourceData) {
  return new Set(
    source.dailyProgress
      .filter((entry) => entry.had_activity)
      .filter((entry) => entry.progress_date >= source.activeSinceDate)
      .map((entry) => entry.user_id),
  )
}
