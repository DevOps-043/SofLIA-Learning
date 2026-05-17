export type LiaMessagesTable = {
  Row: {
  contains_question: boolean | null
  content: string
  conversation_id: string
  cost_usd: number | null
  created_at: string | null
  is_off_topic: boolean | null
  is_system_message: boolean | null
  lia_provided_example: boolean | null
  lia_redirected: boolean | null
  message_id: string
  message_sequence: number
  model_used: string | null
  response_time_ms: number | null
  role: string
  sentiment_score: number | null
  tokens_used: number | null
  user_sentiment: string | null
}
  Insert: {
  contains_question?: boolean | null
  content: string
  conversation_id: string
  cost_usd?: number | null
  created_at?: string | null
  is_off_topic?: boolean | null
  is_system_message?: boolean | null
  lia_provided_example?: boolean | null
  lia_redirected?: boolean | null
  message_id?: string
  message_sequence: number
  model_used?: string | null
  response_time_ms?: number | null
  role: string
  sentiment_score?: number | null
  tokens_used?: number | null
  user_sentiment?: string | null
}
  Update: {
  contains_question?: boolean | null
  content?: string
  conversation_id?: string
  cost_usd?: number | null
  created_at?: string | null
  is_off_topic?: boolean | null
  is_system_message?: boolean | null
  lia_provided_example?: boolean | null
  lia_redirected?: boolean | null
  message_id?: string
  message_sequence?: number
  model_used?: string | null
  response_time_ms?: number | null
  role?: string
  sentiment_score?: number | null
  tokens_used?: number | null
  user_sentiment?: string | null
}
  Relationships: [
    { foreignKeyName: "lia_messages_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "lia_conversation_analytics"; referencedColumns: ["conversation_id"] },
    { foreignKeyName: "lia_messages_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "lia_conversations"; referencedColumns: ["conversation_id"] },
  ]
}
