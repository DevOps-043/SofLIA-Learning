export type LiaConversationAnalyticsView = {
  Row: {
  avg_response_time_ms: number | null
  context_type: string | null
  conversation_completed: boolean | null
  conversation_id: string | null
  course_id: string | null
  course_title: string | null
  duration_seconds: number | null
  ended_at: string | null
  lesson_id: string | null
  lesson_title: string | null
  module_id: string | null
  module_title: string | null
  primary_model: string | null
  started_at: string | null
  total_cost_usd: number | null
  total_lia_messages: number | null
  total_messages: number | null
  total_tokens: number | null
  total_user_messages: number | null
  user_abandoned: boolean | null
  user_avatar: string | null
  user_email: string | null
  user_id: string | null
  user_name: string | null
}
  Relationships: [
    { foreignKeyName: "lia_conversations_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_conversations_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_module_id_fkey"; columns: ["module_id"]; isOneToOne: false; referencedRelation: "course_modules"; referencedColumns: ["module_id"] },
    { foreignKeyName: "lia_conversations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lia_conversations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_conversations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lia_conversations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
