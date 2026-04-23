import type { createClient } from '@/lib/supabase/server'

export type BusinessProgressSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface BusinessAuthContext {
  userId: string
  organizationId: string
}

export interface CourseInfo {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
}

export interface CourseProgressSummary {
  course_id: string
  course_title: string
  thumbnail_url: string | null
  total_assigned: number
  completed: number
  in_progress: number
  not_started: number
  average_progress: number
  total_time_minutes: number
  total_time_hours: number
}

export interface DashboardQueriesResult {
  assignments: AssignmentRow[]
  enrollments: EnrollmentRow[]
  lessonProgress: LessonProgressRow[]
  certificates: CertificateRow[]
}

export interface AssignmentRow {
  user_id: string
  course_id: string
  status: string | null
  completed_at?: string | null
}

export interface EnrollmentRow {
  enrollment_id: string
  user_id: string
  course_id: string
  enrollment_status: string | null
  overall_progress_percentage: number | string | null
  last_accessed_at?: string | null
}

export interface LessonProgressRow {
  user_id: string
  time_spent_minutes: number | null
  enrollment_id: string | null
  user_course_enrollments?: { course_id: string } | null
}

export interface CertificateRow {
  user_id: string
}

export interface OrganizationUserRow {
  user_id: string
  role: string | null
  users: UserProfileRow | null
}

export interface UserProfileRow {
  username: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
  last_login_at: string | null
}
