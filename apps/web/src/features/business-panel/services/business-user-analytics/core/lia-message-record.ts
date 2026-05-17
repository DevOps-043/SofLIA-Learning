export interface LiaMessageRecord {
  message_id: string
  conversation_id: string
  role: string
  content: string
  message_sequence: number | null
  created_at: string | null
  contains_question: boolean | null
  response_time_ms: number | null
  is_off_topic: boolean | null
  lia_redirected: boolean | null
  lia_provided_example: boolean | null
  sentiment_score: number | null
  tokens_used: number | null
}
