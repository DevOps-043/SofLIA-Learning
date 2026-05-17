export interface EnrollmentRecord {
  enrollment_id: string
  course_id: string
  organization_id: string | null
  enrollment_status: string | null
  overall_progress_percentage: number | null
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  updated_at: string | null
}
