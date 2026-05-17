export type UserCourseCertificatesTable = {
  Row: {
    certificate_id: string
    organization_id: string | null
    user_id: string
    course_id: string
    issued_at: string | null
  }
  Insert: {
    certificate_id?: string
    organization_id?: string | null
    user_id: string
    course_id: string
    issued_at?: string | null
  }
  Update: {
    organization_id?: string | null
    issued_at?: string | null
  }
  Relationships: []
}
