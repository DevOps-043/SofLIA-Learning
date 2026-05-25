import type { Json } from '../json'

export type LiaActivityCompletionsTable = {
  Row: {
  activity_id: string
  attempts_to_complete: number | null
  completed_at: string | null
  completed_steps: number | null
  completion_id: string
  conversation_id: string
  created_at: string | null
  current_step: number | null
  generated_output: Json | null
  lia_had_to_redirect: number | null
  organization_id: string | null
  started_at: string | null
  status: string
  time_to_complete_seconds: number | null
  total_steps: number | null
  updated_at: string | null
  user_id: string
  user_needed_help: boolean | null
}
  Insert: {
  activity_id: string
  attempts_to_complete?: number | null
  completed_at?: string | null
  completed_steps?: number | null
  completion_id?: string
  conversation_id: string
  created_at?: string | null
  current_step?: number | null
  generated_output?: Json | null
  lia_had_to_redirect?: number | null
  organization_id?: string | null
  started_at?: string | null
  status: string
  time_to_complete_seconds?: number | null
  total_steps?: number | null
  updated_at?: string | null
  user_id: string
  user_needed_help?: boolean | null
}
  Update: {
  activity_id?: string
  attempts_to_complete?: number | null
  completed_at?: string | null
  completed_steps?: number | null
  completion_id?: string
  conversation_id?: string
  created_at?: string | null
  current_step?: number | null
  generated_output?: Json | null
  lia_had_to_redirect?: number | null
  organization_id?: string | null
  started_at?: string | null
  status?: string
  time_to_complete_seconds?: number | null
  total_steps?: number | null
  updated_at?: string | null
  user_id?: string
  user_needed_help?: boolean | null
}
  Relationships: [
    { foreignKeyName: "lia_activity_completions_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "lesson_activities"; referencedColumns: ["activity_id"] },
    { foreignKeyName: "lia_activity_completions_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "lia_conversation_analytics"; referencedColumns: ["conversation_id"] },
    { foreignKeyName: "lia_activity_completions_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "lia_conversations"; referencedColumns: ["conversation_id"] },
    { foreignKeyName: "lia_activity_completions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_activity_completions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "lia_activity_completions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "lia_activity_completions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lia_activity_completions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_activity_completions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "lia_activity_completions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
