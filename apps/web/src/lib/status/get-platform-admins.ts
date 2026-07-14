import 'server-only'

import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

// Case-insensitive match, same criterion as requireAdmin().
export async function getPlatformAdminIds(): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .ilike('platform_role', 'administrador')

  if (error) {
    logger.error('status.alerting.admins_query_failed', { error: error.message })
    return []
  }

  return (data ?? []).map((row) => row.id)
}
