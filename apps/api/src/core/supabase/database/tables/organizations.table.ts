export type OrganizationsTable = {
  Row: {
    id: string
    name: string
    slug: string | null
    is_active: boolean | null
    subscription_status: string | null
  }
  Insert: {
    id?: string
    name: string
    slug?: string | null
    is_active?: boolean | null
    subscription_status?: string | null
  }
  Update: {
    name?: string
    slug?: string | null
    is_active?: boolean | null
    subscription_status?: string | null
  }
  Relationships: []
}
