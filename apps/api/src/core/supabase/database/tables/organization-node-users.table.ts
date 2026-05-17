export type OrganizationNodeUsersTable = {
  Row: {
    node_id: string
    user_id: string
    status: string | null
  }
  Insert: {
    node_id: string
    user_id: string
    status?: string | null
  }
  Update: {
    status?: string | null
  }
  Relationships: []
}
