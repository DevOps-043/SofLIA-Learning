import type { Json } from '../json'

export type AiModerationLogsTable = {
  Row: {
  api_response: Json | null
  categories: Json | null
  confidence_score: number | null
  content_id: string | null
  content_text: string
  content_type: string
  created_at: string
  is_flagged: boolean
  log_id: string
  model_used: string | null
  processing_time_ms: number | null
  reasoning: string | null
  review_notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  status: string
  user_id: string
}
  Insert: {
  api_response?: Json | null
  categories?: Json | null
  confidence_score?: number | null
  content_id?: string | null
  content_text: string
  content_type: string
  created_at?: string
  is_flagged?: boolean
  log_id?: string
  model_used?: string | null
  processing_time_ms?: number | null
  reasoning?: string | null
  review_notes?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  status?: string
  user_id: string
}
  Update: {
  api_response?: Json | null
  categories?: Json | null
  confidence_score?: number | null
  content_id?: string | null
  content_text?: string
  content_type?: string
  created_at?: string
  is_flagged?: boolean
  log_id?: string
  model_used?: string | null
  processing_time_ms?: number | null
  reasoning?: string | null
  review_notes?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  status?: string
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "ai_moderation_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "ai_moderation_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "ai_moderation_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "ai_moderation_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
