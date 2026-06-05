import type { Json } from '../../types'

export type LiaLiveSessionsTable = {
  Row: {
    assistant_transcript_count: number
    context: Json | null
    context_type: string
    conversation_id: string | null
    created_at: string
    duration_ms: number | null
    ended_at: string | null
    error_count: number
    interruption_count: number
    language: string | null
    model: string | null
    organization_id: string | null
    outcome: string
    session_id: string
    source: string
    started_at: string
    turn_count: number
    updated_at: string
    user_id: string
    user_transcript_count: number
  }
  Insert: {
    assistant_transcript_count?: number
    context?: Json | null
    context_type?: string
    conversation_id?: string | null
    created_at?: string
    duration_ms?: number | null
    ended_at?: string | null
    error_count?: number
    interruption_count?: number
    language?: string | null
    model?: string | null
    organization_id?: string | null
    outcome?: string
    session_id: string
    source?: string
    started_at: string
    turn_count?: number
    updated_at?: string
    user_id: string
    user_transcript_count?: number
  }
  Update: {
    assistant_transcript_count?: number
    context?: Json | null
    context_type?: string
    conversation_id?: string | null
    created_at?: string
    duration_ms?: number | null
    ended_at?: string | null
    error_count?: number
    interruption_count?: number
    language?: string | null
    model?: string | null
    organization_id?: string | null
    outcome?: string
    session_id?: string
    source?: string
    started_at?: string
    turn_count?: number
    updated_at?: string
    user_id?: string
    user_transcript_count?: number
  }
  Relationships: [
    { foreignKeyName: "lia_live_sessions_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "lia_conversations"; referencedColumns: ["conversation_id"] },
    { foreignKeyName: "lia_live_sessions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "lia_live_sessions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
  ]
}
