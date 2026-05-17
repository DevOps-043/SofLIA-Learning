export type LiaConversationsTable = {
  Row: {
    id: string
    user_id: string
    context_type: string | null
    created_at: string | null
  }
  Insert: {
    id?: string
    user_id: string
    context_type?: string | null
    created_at?: string | null
  }
  Update: {
    context_type?: string | null
    created_at?: string | null
  }
  Relationships: []
}
