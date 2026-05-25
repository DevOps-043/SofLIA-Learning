export interface AuditLogEntry {
  id?: string
  user_id: string
  admin_user_id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  table_name: string
  record_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export type AuditLogAction = AuditLogEntry['action']
