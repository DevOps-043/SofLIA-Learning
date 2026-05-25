import type { Json } from '../json'

export type VAiGeneratedPlansView = {
  Row: {
  ai_generation_metadata: Json | null
  completed_sessions: number | null
  completion_percentage: number | null
  created_at: string | null
  plan_id: string | null
  plan_name: string | null
  preferred_session_type: string | null
  total_sessions: number | null
  user_id: string | null
}
  Relationships: [
    { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
