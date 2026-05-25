export type LiaMessagesTokensTmpTable = {
  Row: {
  contains_question: boolean | null
  content: string | null
  conversation_id: string | null
  cost_usd: number | null
  created_at: string | null
  is_off_topic: boolean | null
  is_system_message: boolean | null
  lia_provided_example: boolean | null
  lia_redirected: boolean | null
  message_id: string
  message_sequence: number | null
  model_used: string | null
  response_time_ms: number | null
  role: string | null
  sentiment_score: number | null
  tokens_used: number | null
  user_sentiment: string | null
}
  Insert: {
  contains_question?: boolean | null
  content?: string | null
  conversation_id?: string | null
  cost_usd?: number | null
  created_at?: string | null
  is_off_topic?: boolean | null
  is_system_message?: boolean | null
  lia_provided_example?: boolean | null
  lia_redirected?: boolean | null
  message_id: string
  message_sequence?: number | null
  model_used?: string | null
  response_time_ms?: number | null
  role?: string | null
  sentiment_score?: number | null
  tokens_used?: number | null
  user_sentiment?: string | null
}
  Update: {
  contains_question?: boolean | null
  content?: string | null
  conversation_id?: string | null
  cost_usd?: number | null
  created_at?: string | null
  is_off_topic?: boolean | null
  is_system_message?: boolean | null
  lia_provided_example?: boolean | null
  lia_redirected?: boolean | null
  message_id?: string
  message_sequence?: number | null
  model_used?: string | null
  response_time_ms?: number | null
  role?: string | null
  sentiment_score?: number | null
  tokens_used?: number | null
  user_sentiment?: string | null
}
  Relationships: []
}
