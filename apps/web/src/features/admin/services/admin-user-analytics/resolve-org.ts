import type { BusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { logger } from '@/lib/utils/logger'

/**
 * Resuelve la organización a la que pertenece un usuario para fines de analytics
 * del superadministrador. Un usuario puede estar en varias organizaciones; si se
 * provee `preferredOrganizationId` y el usuario pertenece a ella, se prioriza
 * (permite desambiguar desde el filtro de empresa). En caso contrario se devuelve
 * la primera organización encontrada, o `null` si no pertenece a ninguna.
 */
export async function resolveAdminUserOrganizationId(
  supabase: BusinessUsersAdminClient,
  userId: string,
  preferredOrganizationId?: string | null,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)

  if (error) {
    logger.error('resolveAdminUserOrganizationId failed', { userId, error })
    return null
  }

  const organizationIds = (data ?? [])
    .map((row) => row.organization_id)
    .filter((value): value is string => Boolean(value))

  if (organizationIds.length === 0) {
    return null
  }

  if (preferredOrganizationId && organizationIds.includes(preferredOrganizationId)) {
    return preferredOrganizationId
  }

  return organizationIds[0]
}
