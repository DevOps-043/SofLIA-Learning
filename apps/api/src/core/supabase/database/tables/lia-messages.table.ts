export type LiaMessagesTable = {
  Row: {
    id: string
    conversation_id: string
    role: string | null
    user_id: string
  }
  Insert: {
    id?: string
    conversation_id: string
    role?: string | null
    user_id: string
  }
  Update: {
    role?: string | null
  }
  Relationships: []
}
