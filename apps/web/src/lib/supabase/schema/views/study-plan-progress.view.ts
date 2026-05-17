export type StudyPlanProgressView = {
  Row: {
  avg_self_evaluation: number | null
  completion_percentage: number | null
  first_session_date: string | null
  last_completed_date: string | null
  last_session_date: string | null
  plan_created_at: string | null
  plan_id: string | null
  plan_name: string | null
  sessions_completed: number | null
  sessions_missed: number | null
  sessions_pending: number | null
  sessions_rescheduled: number | null
  total_planned_minutes: number | null
  total_sessions: number | null
  total_studied_minutes: number | null
  user_id: string | null
}
  Relationships: [
    { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
