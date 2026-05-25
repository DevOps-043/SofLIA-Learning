import type { Database } from '../../../lib/supabase/types'
import type { AuditLogAction, AuditLogEntry } from './auditLog.types'

export function toAuditLogAction(action: string): AuditLogAction {
  switch (action) {
    case 'CREATE':
    case 'UPDATE':
    case 'DELETE':
    case 'VIEW':
      return action
    default:
      return 'VIEW'
  }
}

export function mapAuditLogEntry(
  entry: Database['public']['Tables']['audit_logs']['Row'],
): AuditLogEntry {
  return {
    ...entry,
    action: toAuditLogAction(entry.action),
    old_values: (entry.old_values as Record<string, unknown> | null) || undefined,
    new_values: (entry.new_values as Record<string, unknown> | null) || undefined,
    ip_address: (entry.ip_address as string | null) || undefined,
    user_agent: entry.user_agent || undefined,
    created_at: entry.created_at || undefined,
  }
}
