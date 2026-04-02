import { createClient } from '../../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/supabase/types'

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

type AuditLogAction = AuditLogEntry['action']

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no esta configurada')
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function toAuditLogAction(action: string): AuditLogAction {
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

function mapAuditLogEntry(
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

export class AuditLogService {
  static async logAction(
    entry: Omit<AuditLogEntry, 'id' | 'created_at'>,
  ): Promise<void> {
    try {
      const supabase = createAdminClient()

      await supabase.from('audit_logs').insert({
        user_id: entry.user_id,
        admin_user_id: entry.admin_user_id,
        action: entry.action,
        table_name: entry.table_name,
        record_id: entry.record_id,
        old_values: entry.old_values,
        new_values: entry.new_values,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        created_at: new Date().toISOString(),
      })
    } catch {
      // El audit log no debe romper el flujo principal.
    }
  }

  static async getAuditLogs(
    userId?: string,
    limit = 100,
  ): Promise<AuditLogEntry[]> {
    const supabase = await createClient()

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (data || []).map(mapAuditLogEntry)
  }
}
