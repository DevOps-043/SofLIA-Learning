import type { Json } from '@/core/supabase/database.types'

import type {
  AnalyticsCourseAssignmentRecord,
  AnalyticsCourseCertificateRecord,
  AnalyticsCourseEnrollmentRecord,
  AnalyticsDailyProgressRecord,
  AnalyticsLessonProgressRecord,
  AnalyticsOrganizationInfo,
  AnalyticsOrganizationUserRecord,
} from './analytics-records.types'

export interface AnalyticsStudySessionRecord {
  id: string
  user_id: string
  start_time: string | null
  actual_duration_minutes: number | null
  status: string | null
  completed_at: string | null
  session_type: string | null
}

export interface AnalyticsOrganizationNodeMemberRecord {
  user_id: string
}

export interface AnalyticsOrganizationNodeRecord {
  id: string
  name: string
  type: string | null
  properties: Json
  organization_node_users: AnalyticsOrganizationNodeMemberRecord[] | null
}

export interface AnalyticsSourceData {
  organization: AnalyticsOrganizationInfo
  orgUsers: AnalyticsOrganizationUserRecord[]
  assignments: AnalyticsCourseAssignmentRecord[]
  enrollments: AnalyticsCourseEnrollmentRecord[]
  certificates: AnalyticsCourseCertificateRecord[]
  lessonProgress: AnalyticsLessonProgressRecord[]
  dailyProgress: AnalyticsDailyProgressRecord[]
  studySessions: AnalyticsStudySessionRecord[]
  nodes: AnalyticsOrganizationNodeRecord[]
  activeSinceDate: string
}
