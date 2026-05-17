export type LiaUserFeedbackTable = {
  Row: {
  comment: string | null
  conversation_id: string
  created_at: string | null
  feedback_id: string
  feedback_type: string
  message_id: string
  rating: number | null
  response_off_topic: boolean | null
  response_too_long: boolean | null
  response_too_short: boolean | null
  user_id: string
}
  Insert: {
  comment?: string | null
  conversation_id: string
  created_at?: string | null
  feedback_id?: string
  feedback_type: string
  message_id: string
  rating?: number | null
  response_off_topic?: boolean | null
  response_too_long?: boolean | null
  response_too_short?: boolean | null
  user_id: string
}
  Update: {
  comment?: string | null
  conversation_id?: string
  created_at?: string | null
  feedback_id?: string
  feedback_type?: string
  message_id?: string
  rating?: number | null
  response_off_topic?: boolean | null
  response_too_long?: boolean | null
  response_too_short?: boolean | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "lia_user_feedback_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "lia_conversation_analytics"; referencedColumns: ["conversation_id"] },
    { foreignKeyName: "lia_user_feedback_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "lia_conversations"; referencedColumns: ["conversation_id"] },
    { foreignKeyName: "lia_user_feedback_message_id_fkey"; columns: ["message_id"]; isOneToOne: false; referencedRelation: "lia_messages"; referencedColumns: ["message_id"] },
    { foreignKeyName: "lia_user_feedback_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lia_user_feedback_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_user_feedback_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lia_user_feedback_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
