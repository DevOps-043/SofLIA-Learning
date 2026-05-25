export type LessonTrackingTable = {
  Row: {
  completed_at: string | null
  created_at: string
  end_trigger: string | null
  id: string
  last_activity_at: string | null
  lesson_id: string
  lia_first_message_at: string | null
  lia_last_message_at: string | null
  next_analysis_at: string | null
  organization_id: string | null
  plan_id: string | null
  post_content_start_at: string | null
  session_id: string | null
  start_trigger: string | null
  started_at: string | null
  status: string
  t_lesson_minutes: number | null
  t_materials_minutes: number | null
  t_restante_minutes: number | null
  t_video_minutes: number | null
  updated_at: string
  user_id: string
  video_ended_at: string | null
  video_started_at: string | null
}
  Insert: {
  completed_at?: string | null
  created_at?: string
  end_trigger?: string | null
  id?: string
  last_activity_at?: string | null
  lesson_id: string
  lia_first_message_at?: string | null
  lia_last_message_at?: string | null
  next_analysis_at?: string | null
  organization_id?: string | null
  plan_id?: string | null
  post_content_start_at?: string | null
  session_id?: string | null
  start_trigger?: string | null
  started_at?: string | null
  status?: string
  t_lesson_minutes?: number | null
  t_materials_minutes?: number | null
  t_restante_minutes?: number | null
  t_video_minutes?: number | null
  updated_at?: string
  user_id: string
  video_ended_at?: string | null
  video_started_at?: string | null
}
  Update: {
  completed_at?: string | null
  created_at?: string
  end_trigger?: string | null
  id?: string
  last_activity_at?: string | null
  lesson_id?: string
  lia_first_message_at?: string | null
  lia_last_message_at?: string | null
  next_analysis_at?: string | null
  organization_id?: string | null
  plan_id?: string | null
  post_content_start_at?: string | null
  session_id?: string | null
  start_trigger?: string | null
  started_at?: string | null
  status?: string
  t_lesson_minutes?: number | null
  t_materials_minutes?: number | null
  t_restante_minutes?: number | null
  t_video_minutes?: number | null
  updated_at?: string
  user_id?: string
  video_ended_at?: string | null
  video_started_at?: string | null
}
  Relationships: [
    { foreignKeyName: "lesson_tracking_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_tracking_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_tracking_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_tracking_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "lesson_tracking_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "lesson_tracking_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "lesson_tracking_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "study_plan_progress"; referencedColumns: ["plan_id"] },
    { foreignKeyName: "lesson_tracking_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "study_plans"; referencedColumns: ["id"] },
    { foreignKeyName: "lesson_tracking_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "v_ai_generated_plans"; referencedColumns: ["plan_id"] },
    { foreignKeyName: "lesson_tracking_session_id_fkey"; columns: ["session_id"]; isOneToOne: false; referencedRelation: "study_sessions"; referencedColumns: ["id"] },
    { foreignKeyName: "lesson_tracking_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lesson_tracking_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "lesson_tracking_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lesson_tracking_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
