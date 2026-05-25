export type UserCourseEnrollmentsTable = {
  Row: {
    enrollment_id: string
    user_id: string
    course_id: string
    overall_progress_percentage: number | null
    enrollment_status: string | null
    completed_at: string | null
    started_at: string | null
  }
  Insert: {
    enrollment_id?: string
    user_id: string
    course_id: string
    overall_progress_percentage?: number | null
    enrollment_status?: string | null
    completed_at?: string | null
    started_at?: string | null
  }
  Update: {
    overall_progress_percentage?: number | null
    enrollment_status?: string | null
    completed_at?: string | null
    started_at?: string | null
  }
  Relationships: []
}
