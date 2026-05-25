export type OrganizationCourseAssignmentsTable = {
  Row: {
    id: string
    organization_id: string
    user_id: string
    course_id: string
    status: string | null
    completion_percentage: number | null
    assigned_at: string | null
    due_date: string | null
    completed_at: string | null
  }
  Insert: {
    id?: string
    organization_id: string
    user_id: string
    course_id: string
    status?: string | null
    completion_percentage?: number | null
    assigned_at?: string | null
    due_date?: string | null
    completed_at?: string | null
  }
  Update: {
    status?: string | null
    completion_percentage?: number | null
    assigned_at?: string | null
    due_date?: string | null
    completed_at?: string | null
  }
  Relationships: []
}
