export type LiaCourseAnalyticsView = {
  Row: {
  avg_duration_seconds: number | null
  course_id: string | null
  course_title: string | null
  lesson_id: string | null
  lesson_title: string | null
  module_id: string | null
  module_title: string | null
  total_conversations: number | null
  total_cost_usd: number | null
  total_messages: number | null
  total_tokens_consumed: number | null
  unique_users: number | null
}
  Relationships: [
    { foreignKeyName: "lia_conversations_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_conversations_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_conversations_module_id_fkey"; columns: ["module_id"]; isOneToOne: false; referencedRelation: "course_modules"; referencedColumns: ["module_id"] },
  ]
}
