export type UserActivityLogTable = {
  Row: {
  action_description: string | null
  action_timestamp: string | null
  action_type: string
  course_id: string | null
  ip_address: unknown
  lesson_id: string | null
  log_id: string
  organization_id: string | null
  session_id: string | null
  user_agent: string | null
  user_id: string
}
  Insert: {
  action_description?: string | null
  action_timestamp?: string | null
  action_type: string
  course_id?: string | null
  ip_address?: unknown
  lesson_id?: string | null
  log_id?: string
  organization_id?: string | null
  session_id?: string | null
  user_agent?: string | null
  user_id: string
}
  Update: {
  action_description?: string | null
  action_timestamp?: string | null
  action_type?: string
  course_id?: string | null
  ip_address?: unknown
  lesson_id?: string | null
  log_id?: string
  organization_id?: string | null
  session_id?: string | null
  user_agent?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_activity_log_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "user_activity_log_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "user_activity_log_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_activity_log_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_activity_log_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_activity_log_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_activity_log_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_activity_log_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_activity_log_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_activity_log_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_activity_log_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_activity_log_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
