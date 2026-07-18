import type { createAdminClient } from '@/lib/supabase/admin'
import type { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { HierarchyAutoAssignConfig } from './types'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>

export async function loadHierarchyAutoAssignConfig(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<HierarchyAutoAssignConfig> {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('hierarchy_enabled, hierarchy_config')
      .eq('id', organizationId)
      .single()

    const config = org?.hierarchy_config as Record<string, unknown> | null
    if (!org?.hierarchy_enabled || !config?.auto_assign_new_users) {
      return { enabled: false, defaultTeamId: null }
    }

    // organization_nodes no tiene columna is_active — pedirla rompe la consulta (42703)
    const { data: defaultTeam } = await supabase
      .from('organization_nodes')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('type', 'team')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    return { enabled: true, defaultTeamId: defaultTeam?.id || null }
  } catch (configError) {
    logger.warn('[import] Could not load hierarchy config', { error: configError })
    return { enabled: false, defaultTeamId: null }
  }
}

export async function autoAssignUserToDefaultTeam(
  supabase: SupabaseServerClient,
  userId: string,
  hierarchy: HierarchyAutoAssignConfig,
): Promise<void> {
  if (!hierarchy.enabled || !hierarchy.defaultTeamId) return

  try {
    await supabase.from('organization_node_users').insert({
      node_id: hierarchy.defaultTeamId,
      user_id: userId,
      role: 'member',
      is_primary: true,
    })
  } catch (autoAssignError) {
    logger.warn('[import] Auto-assign failed for user', {
      userId,
      error: autoAssignError,
    })
  }
}
