import type { Json } from '../json'

export type SecurityAuditLogTable = {
  Row: {
    action: string
    actor_id: string | null
    actor_role: string | null
    id: number
    ip: unknown | null
    metadata: Json
    occurred_at: string
    org_id: string | null
    resource_id: string | null
    resource_type: string | null
    result: 'success' | 'denied' | 'error'
    user_agent: string | null
  }
  Insert: {
    action: string
    actor_id?: string | null
    actor_role?: string | null
    id?: number
    ip?: unknown | null
    metadata?: Json
    occurred_at?: string
    org_id?: string | null
    resource_id?: string | null
    resource_type?: string | null
    result: 'success' | 'denied' | 'error'
    user_agent?: string | null
  }
  Update: never
  Relationships: [
    { foreignKeyName: 'security_audit_log_actor_id_fkey'; columns: ['actor_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
    { foreignKeyName: 'security_audit_log_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
  ]
}
