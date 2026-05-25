import { DatabaseError } from '@/core/errors/app-error'
import { getServiceClient } from '@/core/supabase/service-client'

import type { AdminUserMembershipRow } from './admin-users.utils'

export async function findMemberships(userIds: string[], activeOnly: boolean) {
  if (userIds.length === 0) {
    return []
  }

  const client = getServiceClient()
  let query = client
    .from('organization_users')
    .select('user_id, organization_id, role, status, organizations(name, slug)')
    .in('user_id', userIds)

  if (activeOnly) {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query

  if (error) {
    throw new DatabaseError(
      'Error al obtener las membresias de organizacion',
      error,
    )
  }

  return (data ?? []) as AdminUserMembershipRow[]
}
