import type { createClient } from '@/lib/supabase/server'
import type { AssignedLearningPathDashboard } from '@/features/learning-paths/services/learning-path-dashboard.service'

export type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>

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
  status: 'No iniciado' | 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
  source?: 'direct'
  learning_path_position?: number | null
}

export interface CourseAssignmentCourse {
  id: string
  title: string | null
  slug: string | null
  thumbnail_url: string | null
  instructor_id: string | null
}

export interface DirectAssignmentRow {
  id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string
  due_date: string | null
  completed_at: string | null
  courses: CourseAssignmentCourse | null
  source?: 'direct'
}

export interface CertificateRow {
  certificate_id: string
  course_id: string
}

export interface EnrollmentRow {
  enrollment_id: string
  course_id: string
  organization_id: string | null
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

export interface InstructorSummary {
  name: string
}

export interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

export interface DashboardAuthContext {
  userId: string
  organizationId: string
  orgSlug: string
}

export interface DashboardBaseData {
  combinedAssignments: DirectAssignmentRow[]
  certificates: CertificateRow[]
  certificatesMap: Map<string, boolean>
  courseIds: string[]
  instructorIds: string[]
}

export interface DashboardEnrichmentData {
  enrollmentsMap: Map<string, EnrollmentRow>
  instructorMap: Map<string, InstructorSummary>
  learningPaths: AssignedLearningPathDashboard[]
}
