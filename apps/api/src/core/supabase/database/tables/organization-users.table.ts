export type OrganizationUsersTable = {
  Row: {
    id: string
    user_id: string
    organization_id: string
    role: string | null
    status: string | null
    joined_at: string | null
    job_title: string | null
    invited_by: string | null
    created_at: string | null
    updated_at: string | null
  }
  Insert: {
    id?: string
    user_id: string
    organization_id: string
    role?: string | null
    status?: string | null
    joined_at?: string | null
    job_title?: string | null
    invited_by?: string | null
    created_at?: string | null
    updated_at?: string | null
  }
  Update: {
    role?: string | null
    status?: string | null
    joined_at?: string | null
    job_title?: string | null
    invited_by?: string | null
    updated_at?: string | null
  }
  Relationships: []
}
