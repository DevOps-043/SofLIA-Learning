export interface LiaConversationRecord {
  conversation_id: string
  course_id: string | null
  organization_id: string | null
  context_type: string
  conversation_completed: boolean | null
  started_at: string
  ended_at: string | null
  created_at: string | null
  updated_at: string | null
  total_messages: number | null
  total_lia_messages: number | null
  total_user_messages: number | null
}
