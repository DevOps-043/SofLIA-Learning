import type { Json } from '../json'

export type AuditLogsTable = {
  Row: {
  action: string
  admin_user_id: string
  created_at: string | null
  id: string
  ip_address: unknown
  new_values: Json | null
  old_values: Json | null
  record_id: string
  table_name: string
  user_agent: string | null
  user_id: string
}
  Insert: {
  action: string
  admin_user_id: string
  created_at?: string | null
  id?: string
  ip_address?: unknown
  new_values?: Json | null
  old_values?: Json | null
  record_id: string
  table_name: string
  user_agent?: string | null
  user_id: string
}
  Update: {
  action?: string
  admin_user_id?: string
  created_at?: string | null
  id?: string
  ip_address?: unknown
  new_values?: Json | null
  old_values?: Json | null
  record_id?: string
  table_name?: string
  user_agent?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "audit_logs_admin_user_id_fkey"; columns: ["admin_user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "audit_logs_admin_user_id_fkey"; columns: ["admin_user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "audit_logs_admin_user_id_fkey"; columns: ["admin_user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "audit_logs_admin_user_id_fkey"; columns: ["admin_user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "audit_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "audit_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "audit_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "audit_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
