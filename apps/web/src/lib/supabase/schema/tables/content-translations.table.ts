import type { Json } from '../json'

export type ContentTranslationsTable = {
  Row: {
  created_at: string | null
  created_by: string | null
  entity_id: string
  entity_type: string
  id: string
  language_code: string
  translations: Json
  updated_at: string | null
}
  Insert: {
  created_at?: string | null
  created_by?: string | null
  entity_id: string
  entity_type: string
  id?: string
  language_code: string
  translations?: Json
  updated_at?: string | null
}
  Update: {
  created_at?: string | null
  created_by?: string | null
  entity_id?: string
  entity_type?: string
  id?: string
  language_code?: string
  translations?: Json
  updated_at?: string | null
}
  Relationships: [
    { foreignKeyName: "content_translations_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "content_translations_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "content_translations_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "content_translations_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
