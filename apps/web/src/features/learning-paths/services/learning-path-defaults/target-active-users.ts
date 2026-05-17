import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { OrganizationUserRow } from './types'

export async function getAllActiveUserIds(organizationId: string) {
  const { data, error } = await fromLoose<OrganizationUserRow>(
    createAdminClient(),
    'organization_users',
  )
    .select('user_id, status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (error) {
    logger.error('Error loading organization users for learning path bulk assign:', error)
    throw new Error('No se pudieron cargar los usuarios de la organizacion')
  }

  return [...new Set((data || []).map((row) => row.user_id))]
}

export async function filterActiveUserIds(organizationId: string, candidateUserIds: string[]) {
  if (candidateUserIds.length === 0) return []

  const { data, error } = await fromLoose<OrganizationUserRow>(
    createAdminClient(),
    'organization_users',
  )
    .select('user_id, status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .in('user_id', candidateUserIds)

  if (error) {
    logger.error('Error validating active users for learning path target:', error)
    throw new Error('No se pudieron validar los usuarios activos')
  }

  return [...new Set((data || []).map((row) => row.user_id))]
}
