import type { Json } from '@/core/supabase/database.types'

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
