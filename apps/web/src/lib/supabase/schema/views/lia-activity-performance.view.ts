export type LiaActivityPerformanceView = {
  Row: {
  activity_id: string | null
  activity_title: string | null
  activity_type: string | null
  avg_attempts: number | null
  avg_time_seconds: number | null
  completed_count: number | null
  completion_rate_percentage: number | null
  course_id: string | null
  course_title: string | null
  help_needed_count: number | null
  total_attempts: number | null
  unique_users: number | null
}
  Relationships: [
    { foreignKeyName: "lia_activity_completions_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "lesson_activities"; referencedColumns: ["activity_id"] },
    { foreignKeyName: "lia_conversations_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_conversations_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
  ]
}
