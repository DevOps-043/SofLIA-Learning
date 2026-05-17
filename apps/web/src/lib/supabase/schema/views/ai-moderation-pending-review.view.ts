import type { Json } from '../json'

export type AiModerationPendingReviewView = {
  Row: {
  categories: Json | null
  confidence_score: number | null
  content_id: string | null
  content_preview: string | null
  content_type: string | null
  created_at: string | null
  email: string | null
  is_flagged: boolean | null
  log_id: string | null
  reasoning: string | null
  user_id: string | null
  user_warning_count: number | null
  username: string | null
}
  Relationships: [
    { foreignKeyName: "ai_moderation_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "ai_moderation_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "ai_moderation_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "ai_moderation_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
