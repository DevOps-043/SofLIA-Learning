import { createClient } from '@/lib/supabase/server'

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export interface DashboardStats {
  total_assigned: number
  in_progress: number
  completed: number
  certificates: number
}

export interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
  source?: 'direct' | 'team'
  learning_path_position?: number | null
}

export interface LearningPathItemPositionRow {
  course_id: string
  position: number
  learning_path_id: string
}

export interface RelatedCourseSummary {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
  instructor_id: string | null
}

export type RelatedCourseValue = RelatedCourseSummary | RelatedCourseSummary[] | null

export interface DirectAssignmentRow {
  id: string
  course_id: string
  status: string
  completion_percentage: number | null
  assigned_at: string
  due_date: string | null
  completed_at: string | null
  courses: RelatedCourseValue
}

export interface TeamAssignmentRow {
  id: string
  team_id: string
  course_id: string
  status: string
  assigned_at: string
  due_date: string | null
  message: string | null
  courses: RelatedCourseValue
}

export interface CombinedAssignmentRow extends DirectAssignmentRow {
  source: 'direct' | 'team'
}

export interface EnrollmentRow {
  enrollment_id: string
  course_id: string
  overall_progress_percentage: number | null
  enrollment_status: string | null
  completed_at: string | null
}

export interface InstructorRow {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
}

export interface CertificateRow {
  certificate_id: string
  course_id: string
}
