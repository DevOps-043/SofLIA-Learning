export type LiaConversationsTable = {
  Row: {
  activity_id: string | null
  browser: string | null
  context_type: string
  conversation_completed: boolean | null
  conversation_id: string
  conversation_title: string | null
  course_id: string | null
  created_at: string | null
  device_type: string | null
  duration_seconds: number | null
  ended_at: string | null
  ip_address: unknown
  lesson_id: string | null
  module_id: string | null
  organization_id: string | null
  started_at: string
  total_lia_messages: number | null
  total_messages: number | null
  total_user_messages: number | null
  updated_at: string | null
  user_abandoned: boolean | null
  user_id: string
}
  Insert: {
  activity_id?: string | null
  browser?: string | null
  context_type: string
  conversation_completed?: boolean | null
  conversation_id?: string
  conversation_title?: string | null
  course_id?: string | null
  created_at?: string | null
  device_type?: string | null
  duration_seconds?: number | null
  ended_at?: string | null
  ip_address?: unknown
  lesson_id?: string | null
  module_id?: string | null
  organization_id?: string | null
  started_at?: string
  total_lia_messages?: number | null
  total_messages?: number | null
  total_user_messages?: number | null
  updated_at?: string | null
  user_abandoned?: boolean | null
  user_id: string
}
  Update: {
  activity_id?: string | null
  browser?: string | null
  context_type?: string
  conversation_completed?: boolean | null
  conversation_id?: string
  conversation_title?: string | null
  course_id?: string | null
  created_at?: string | null
  device_type?: string | null
  duration_seconds?: number | null
  ended_at?: string | null
  ip_address?: unknown
  lesson_id?: string | null
  module_id?: string | null
  organization_id?: string | null
  started_at?: string
  total_lia_messages?: number | null
  total_messages?: number | null
  total_user_messages?: number | null
  updated_at?: string | null
  user_abandoned?: boolean | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "lia_conversations_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "lesson_activities"; referencedColumns: ["activity_id"] },
    { foreignKeyName: "lia_conversations_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_conversations_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_module_id_fkey"; columns: ["module_id"]; isOneToOne: false; referencedRelation: "course_modules"; referencedColumns: ["module_id"] },
    { foreignKeyName: "lia_conversations_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_conversations_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "lia_conversations_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "lia_conversations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lia_conversations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_conversations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lia_conversations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
