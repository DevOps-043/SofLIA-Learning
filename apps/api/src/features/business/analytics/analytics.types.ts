import { z } from 'zod'

import { nonEmptyStringSchema } from '@/core/validation/common.schemas'
import type { Json } from '@/core/supabase/database.types'

export const analyticsOrgIdParamsSchema = z.object({
  orgId: nonEmptyStringSchema,
})

export const analyticsExportScopeSchema = z.enum(['summary', 'users', 'teams'])

export const analyticsExportQuerySchema = z.object({
  scope: analyticsExportScopeSchema.default('users'),
})

export type AnalyticsExportScope = z.infer<typeof analyticsExportScopeSchema>

export interface AnalyticsOrganizationInfo {
  id: string
  name: string
  slug: string | null
}

export interface AnalyticsUserProfileRecord {
  id: string
  username: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
  last_login_at: string | null
}

export type AnalyticsUserProfileRelation =
  | AnalyticsUserProfileRecord
  | AnalyticsUserProfileRecord[]
  | null

export interface AnalyticsOrganizationUserRecord {
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  job_title: string | null
  users: AnalyticsUserProfileRelation
}

export interface AnalyticsCourseAssignmentRecord {
  id: string
  user_id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
}

export interface AnalyticsCourseEnrollmentRecord {
  enrollment_id: string
  user_id: string
  course_id: string
  overall_progress_percentage: number | null
  enrollment_status: string | null
  completed_at: string | null
  started_at: string | null
}

export interface AnalyticsCourseCertificateRecord {
  certificate_id: string
  user_id: string
  course_id: string
  issued_at: string | null
}

export interface AnalyticsLessonProgressRecord {
  progress_id: string
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

export interface AnalyticsDailyProgressRecord {
  user_id: string
  progress_date: string
  had_activity: boolean | null
  streak_count: number | null
  study_minutes: number | null
  sessions_completed: number | null
  sessions_missed: number | null
}

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

export interface AnalyticsTrendData {
  date: string
  count: number
}

export interface AnalyticsRoleMetric {
  role: string
  count?: number
  average_progress?: number
  total_completed?: number
  average_hours?: number
}

export interface AnalyticsCourseDistribution {
  status: string
  count: number
}

export interface AnalyticsStickinessPoint {
  name: string
  dau: number
  mau: number
  ratio: number
}

export interface AnalyticsFrequencyPoint {
  name: string
  users: number
}

export interface AnalyticsStreakPoint {
  name: string
  value: number
}

export interface AnalyticsHeatmapPoint {
  day: string
  hour: string
  value: number
}

export interface AnalyticsDurationPoint {
  role: string
  median: number
  max: number
  count: number
}

export interface AnalyticsUserPlannerStats {
  adherence: number
  total_sessions: number
  completed_sessions: number
  pending_sessions: number
}

export interface AnalyticsUserCourseStats {
  total_lesson_time_minutes: number
  lessons_completed: number
  quizzes_completed: number
  quizzes_passed: number
}

export interface AnalyticsUserStats {
  current_streak: number
  planner: AnalyticsUserPlannerStats
  courses: AnalyticsUserCourseStats
}

export interface AnalyticsUser {
  user_id: string
  display_name: string
  email: string
  username: string
  role: string
  profile_picture_url: string | null
  courses_assigned: number
  courses_completed: number
  average_progress: number
  total_time_hours: number
  total_time_minutes: number
  certificates_count: number
  last_login_at: string | null
  last_active: string | null
  joined_at: string | null
  stats: AnalyticsUserStats
}

export interface AnalyticsTeamStats {
  average_progress: number
  courses_completed: number
  total_assignments: number
  total_time_hours: number
  active_members: number
}

export interface AnalyticsTeam {
  team_id: string
  name: string
  description: string | null
  image_url: string | null
  member_count: number
  stats: AnalyticsTeamStats
}

export interface AnalyticsTeamsData {
  total_teams: number
  teams: AnalyticsTeam[]
  ranking: AnalyticsTeam[]
}

export interface AnalyticsGeneralMetrics {
  total_users: number
  total_courses_assigned: number
  completed_courses: number
  average_progress: number
  total_time_hours: number
  total_certificates: number
  active_users: number
  retention_rate: number
}

export interface BusinessAnalyticsData {
  organization: AnalyticsOrganizationInfo
  general_metrics: AnalyticsGeneralMetrics
  user_analytics: AnalyticsUser[]
  trends: {
    enrollments_by_month: AnalyticsTrendData[]
    completions_by_month: AnalyticsTrendData[]
    time_by_month: AnalyticsTrendData[]
    active_users_by_month: AnalyticsTrendData[]
  }
  by_role: {
    distribution: AnalyticsRoleMetric[]
    progress_comparison: AnalyticsRoleMetric[]
    completions: AnalyticsRoleMetric[]
    time_spent: AnalyticsRoleMetric[]
  }
  course_metrics: {
    distribution: AnalyticsCourseDistribution[]
  }
  engagement_metrics: {
    stickiness: AnalyticsStickinessPoint[]
    frequency: AnalyticsFrequencyPoint[]
    streaks: AnalyticsStreakPoint[]
    heatmap: AnalyticsHeatmapPoint[]
    duration: AnalyticsDurationPoint[]
  }
  teams: AnalyticsTeamsData
}

export interface AnalyticsExportFile {
  filename: string
  contentType: 'text/csv; charset=utf-8'
  body: string
}
