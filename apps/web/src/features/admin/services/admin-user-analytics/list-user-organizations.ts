import type { BusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { logger } from '@/lib/utils/logger'

export interface AdminUserOrganizationOption {
  id: string
  name: string
}

type OrganizationJoin = { name: string | null } | Array<{ name: string | null }> | null

function resolveOrganizationName(join: OrganizationJoin): string | null {
  if (!join) return null
  const row = Array.isArray(join) ? join[0] : join
  return row?.name ?? null
}

/**
 * Lista las organizaciones (activas) a las que pertenece un usuario, para poblar
 * el selector de organización de las estadísticas del superadministrador. Mismo
 * cliente/elevación que `resolveAdminUserOrganizationId`. Las organizaciones sin
 * nombre resuelto se omiten (no se pueden mostrar en el selector).
 */
export async function listAdminUserOrganizations(
  supabase: BusinessUsersAdminClient,
  userId: string,
): Promise<AdminUserOrganizationOption[]> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('organization_id, organizations(name)')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    logger.error('listAdminUserOrganizations failed', { userId, error })
    return []
  }

  const options: AdminUserOrganizationOption[] = []
  const seen = new Set<string>()

  for (const row of data ?? []) {
    const id = (row as { organization_id: string | null }).organization_id
    const name = resolveOrganizationName((row as { organizations: OrganizationJoin }).organizations)
    if (!id || !name || seen.has(id)) continue
    seen.add(id)
    options.push({ id, name })
  }

  return options.sort((a, b) => a.name.localeCompare(b.name))
}
